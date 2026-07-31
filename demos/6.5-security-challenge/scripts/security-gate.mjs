// Repo-local security gate for the helpdesk-ai demo. Deterministic, dependency-free,
// and offline-friendly. Wired to `npm run security`.
//
// Blocking checks (fail the gate):
//   1. No secrets in working-tree files.
//   2. .env is gitignored and not tracked.
//   3. No raw-HTML injection sink (dangerouslySetInnerHTML) in the web app.
//   4. The AI Suggested Reply still passes through its output guardrail.
//   5. No CRITICAL production dependency advisories.
// Advisory (reported, non-blocking): production HIGH/MODERATE advisories, and any
// case where `npm audit` can't run (e.g. offline).
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const checks = [];
const warnings = [];
let blocked = false;

function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) blocked = true;
}
function warn(msg) {
  warnings.push(msg);
}
function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

// ---- 1. Secret scan --------------------------------------------------------
const SECRET_PATTERNS = [
  [/\bsk-ant-[A-Za-z0-9_-]{8,}/, "Anthropic API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key id"],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, "private key"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, "GitHub token"],
  [
    /(?:api[_-]?key|secret|client[_-]?secret|passwd|password|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'][^"'\s]{12,}["']/i,
    "hardcoded credential literal",
  ],
];
const SELF = "scripts/security-gate.mjs";

let filesToScan = [];
try {
  filesToScan = sh("git ls-files --cached --others --exclude-standard")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => !/node_modules\/|(^|\/)dist\//.test(f))
    .filter((f) => !/\.(png|jpe?g|webp|gif|ico|pdf|lock)$/i.test(f))
    .filter((f) => f !== "package-lock.json" && f !== SELF);
} catch {
  warn("could not enumerate files via git — secret scan skipped");
}

const secretHits = [];
for (const f of filesToScan) {
  let text;
  try {
    text = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const [re, label] of SECRET_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const line = text.slice(0, m.index).split("\n").length;
      secretHits.push(`${f}:${line} (${label})`);
    }
  }
}
check(
  "No secrets in working-tree files",
  secretHits.length === 0,
  secretHits.length ? secretHits.join(", ") : `${filesToScan.length} files clean`
);

// ---- 2. .env hygiene -------------------------------------------------------
const gitignore = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
const envIgnored = /^\s*\.env\s*$/m.test(gitignore);
let envTracked = "";
try {
  envTracked = sh("git ls-files .env .env.*").trim();
} catch {
  /* none tracked */
}
check(
  ".env gitignored and untracked",
  envIgnored && !envTracked,
  !envIgnored ? ".env missing from .gitignore" : envTracked ? `tracked: ${envTracked}` : "ok"
);

// ---- 3. No raw-HTML injection sink in the web app --------------------------
let xssSinks = "";
try {
  xssSinks = sh("git grep -l dangerouslySetInnerHTML -- apps/web/src").trim();
} catch {
  /* git grep exits non-zero when there are no matches */
}
check("No dangerouslySetInnerHTML in web UI", xssSinks === "", xssSinks || "none");

// ---- 4. AI output guardrail is wired ---------------------------------------
const llmPath = "apps/api/src/llm.ts";
const llm = existsSync(llmPath) ? readFileSync(llmPath, "utf8") : "";
const guardWired = /\bguardReply\s*\(/.test(llm) && /function\s+guardReply\b/.test(llm);
check(
  "AI Suggested Reply passes through the output guardrail",
  guardWired,
  guardWired ? "guardReply enforced in suggestReply" : `guardReply not wired in ${llmPath}`
);

// ---- 4b. Escalate endpoint hardening (regression guards) -------------------
// Dependency-confusion scope must not reappear in any package manifest.
let manifests = [];
try {
  manifests = sh("git ls-files package.json apps/*/package.json packages/*/package.json")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  /* fall back to none */
}
const confusionHits = manifests.filter(
  (f) => existsSync(f) && /@helpdesk-ai\//.test(readFileSync(f, "utf8"))
);
check(
  "No dependency-confusion `@helpdesk-ai/*` package in manifests",
  confusionHits.length === 0,
  confusionHits.length ? confusionHits.join(", ") : "none"
);

// Scan code only — comments legitimately mention the patterns we forbid.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const escPath = "apps/api/src/routes/escalate.ts";
if (existsSync(escPath)) {
  const esc = stripComments(readFileSync(escPath, "utf8"));
  check(
    "escalate: request body schema rejects unknown fields",
    /additionalProperties:\s*false/.test(esc),
    /additionalProperties:\s*false/.test(esc) ? "additionalProperties:false" : "no strict body schema"
  );
  check(
    "escalate: no caller-controlled webhook (SSRF)",
    !/webhookUrl/.test(esc),
    /webhookUrl/.test(esc) ? "reads webhookUrl from the request" : "server-configured destination"
  );
  check(
    "escalate: scoped to one ticket (no customer directory)",
    !/getTickets\s*\(/.test(esc),
    /getTickets\s*\(/.test(esc) ? "pulls the full ticket/customer directory" : "single-ticket only"
  );
}

// ---- 5. Production dependency advisories -----------------------------------
let audit = null;
try {
  audit = JSON.parse(sh("npm audit --omit=dev --json"));
} catch (e) {
  // npm audit exits non-zero when advisories exist; the JSON is still on stdout.
  const out = e && e.stdout ? e.stdout.toString() : "";
  try {
    audit = JSON.parse(out);
  } catch {
    audit = null;
  }
}
if (audit && audit.metadata && audit.metadata.vulnerabilities) {
  const v = audit.metadata.vulnerabilities;
  check(
    "No CRITICAL production dependency advisories",
    (v.critical || 0) === 0,
    `prod: ${v.critical || 0} critical, ${v.high || 0} high, ${v.moderate || 0} moderate, ${v.low || 0} low`
  );
  if ((v.high || 0) > 0) {
    warn(`${v.high} production HIGH advisories — triage with \`npm audit --omit=dev\``);
  }
} else {
  warn("`npm audit` unavailable (offline?) — dependency check skipped");
}

// ---- Report ----------------------------------------------------------------
console.log("Security gate\n");
for (const c of checks) {
  console.log(`  ${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
for (const w of warnings) {
  console.log(`  ! ${w}`);
}
console.log("");

if (blocked) {
  console.error("FAIL — security gate blocked. Fix the ✗ items above before claiming done.");
  process.exit(1);
}
console.log("OK — security gate passed.");
