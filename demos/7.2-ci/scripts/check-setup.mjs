// Quick environment check used in Demo D0 (Set up the sample projects).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const tickets = JSON.parse(readFileSync(join(root, "..", "data", "tickets.json"), "utf8"));

const major = Number(process.versions.node.split(".")[0]);
console.log(`Node ${process.versions.node} ${major >= 20 ? "OK" : "-- need >= 20"}`);
console.log(`Seed tickets loaded: ${tickets.length}`);
console.log(
  process.env.ANTHROPIC_API_KEY
    ? "ANTHROPIC_API_KEY set -- the AI Suggested Reply will call the real model."
    : "ANTHROPIC_API_KEY not set -- the AI Suggested Reply uses a deterministic mock (fine for demos)."
);
console.log("Setup looks good. Run `npm run dev` to start the API (3001) and web (5173).");
