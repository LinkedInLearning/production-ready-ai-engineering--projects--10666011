// Custom PR policy gate for API routes. Simplest maintainable form: a deterministic
// Node script (no deps) that fails with file:line findings.
//
// Policy:
//   1. Input validation - any route under apps/api/src/routes that reads request
//      input (req.body / req.query) MUST declare a strict schema (a Fastify body
//      schema with `additionalProperties` - i.e. unknown-field rejection).
//   2. LLM eval coverage - any route that calls the LLM MUST be covered by an eval
//      (it goes through an eval-covered entrypoint like `suggestReply`, or an eval
//      file references the route).
//
// Scope: the *changed* route files (this is a PR gate, not a whole-repo audit).
//   - CI: set POLICY_BASE=origin/<base-branch> to diff against the PR target.
//   - Local: defaults to working-tree changes (git status).
//   - Or pass explicit files as CLI args.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";

const ROUTES_DIR = "apps/api/src/routes";
const EVALS_DIR = "apps/api/src/evals";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

// git reports paths relative to the repo root; this workspace may be a subdir.
let GIT_PREFIX = "";
try {
  GIT_PREFIX = sh("git rev-parse --show-prefix").trim();
} catch {
  /* not a git repo */
}
function toCwdRelative(p) {
  return GIT_PREFIX && p.startsWith(GIT_PREFIX) ? p.slice(GIT_PREFIX.length) : p;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

// First 1-based line whose (non-comment) text matches `re`.
function firstLine(src, re) {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const stripped = stripComments(lines[i]);
    if (re.test(stripped)) return i + 1;
  }
  return 1;
}

function routeFilesFromArgs() {
  return process.argv.slice(2).filter(Boolean);
}

function routeFilesFromBase(base) {
  const tracked = sh(`git diff --name-only --diff-filter=AMR ${base}...HEAD -- ${ROUTES_DIR}`);
  const untracked = sh(`git ls-files --others --exclude-standard -- ${ROUTES_DIR}`);
  return `${tracked}\n${untracked}`.split("\n");
}

function routeFilesFromWorkingTree() {
  // git status porcelain: "XY path" (rename shows "orig -> new").
  const out = sh(`git status --porcelain -- ${ROUTES_DIR}`);
  return out
    .split("\n")
    .map((l) => l.slice(3).trim())
    .map((p) => (p.includes("->") ? p.split("->").pop().trim() : p));
}

function targetRouteFiles() {
  let candidates = [];
  const args = routeFilesFromArgs();
  if (args.length) {
    candidates = args;
  } else if (process.env.POLICY_BASE) {
    try {
      candidates = routeFilesFromBase(process.env.POLICY_BASE);
    } catch {
      candidates = routeFilesFromWorkingTree();
    }
  } else {
    candidates = routeFilesFromWorkingTree();
  }
  return [...new Set(candidates)]
    .map((s) => toCwdRelative(s.trim()))
    .filter(Boolean)
    .filter((f) => f.startsWith(ROUTES_DIR + "/"))
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".eval.ts"))
    .filter((f) => existsSync(f));
}

function evalCorpus() {
  if (!existsSync(EVALS_DIR)) return "";
  return readdirSync(EVALS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => readFileSync(`${EVALS_DIR}/${f}`, "utf8"))
    .join("\n");
}

const LLM_USE_RE = /suggestReply|@anthropic-ai\/sdk|messages\.create|from\s+["']\.\.\/llm/;

const findings = [];
const targets = targetRouteFiles();
const evals = evalCorpus();

for (const file of targets) {
  const src = readFileSync(file, "utf8");
  const code = stripComments(src);

  // Policy 1 - input validation.
  const readsInput = /req\.body|req\.query/.test(code);
  const hasStrictSchema = /additionalProperties\s*:/.test(code);
  if (readsInput && !hasStrictSchema) {
    findings.push({
      file,
      line: firstLine(src, /req\.(body|query)/),
      rule: "input-validation",
      message:
        "route reads request input (req.body/req.query) without a strict schema - add a Fastify body schema with additionalProperties:false",
    });
  }

  // Policy 2 - LLM routes need an eval case.
  if (LLM_USE_RE.test(code)) {
    const viaCoveredEntrypoint = /suggestReply/.test(code) && /suggestReply/.test(evals);
    const referencedByEval = evals.includes(file.split("/").pop());
    if (!viaCoveredEntrypoint && !referencedByEval) {
      findings.push({
        file,
        line: firstLine(src, LLM_USE_RE),
        rule: "llm-eval-coverage",
        message:
          "route calls the LLM but has no eval case - route it through an eval-covered entrypoint (suggestReply) or add an eval case",
      });
    }
  }
}

console.log("PR policy gate - API routes\n");
if (!targets.length) {
  console.log("  (no new/changed API route files to check)\n");
  console.log("OK - PR policy gate passed.");
  process.exit(0);
}
console.log(`  checking ${targets.length} route file(s): ${targets.map((f) => f.split("/").pop()).join(", ")}\n`);

if (findings.length) {
  for (const f of findings) {
    console.error(`  ✗ ${f.file}:${f.line}  [${f.rule}]  ${f.message}`);
  }
  console.error(`\nFAIL - ${findings.length} policy violation(s).`);
  process.exit(1);
}

console.log("  ✓ all checked routes validate input and (if they call the LLM) are eval-covered\n");
console.log("OK - PR policy gate passed.");
