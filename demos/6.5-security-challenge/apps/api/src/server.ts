import Fastify from "fastify";
import cors from "@fastify/cors";
import { ticketRoutes } from "./routes/tickets.js";
import { replyRoutes } from "./routes/reply.js";
import { escalateRoutes } from "./routes/escalate.js";

// NOTE (course): the escalation endpoint is the Demo D11 security challenge (Claude
// adds it, with planted flaws, then hardens it), and the /api/metrics observability
// endpoint is added in Demo D12 (reliability). Neither exists in the starting state.
const app = Fastify({ logger: true });

await app.register(cors, { origin: ["http://localhost:5173"] });
await app.register(ticketRoutes);
await app.register(replyRoutes);
await app.register(escalateRoutes);

app.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`helpdesk-ai API on http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
