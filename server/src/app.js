import cors from "cors";
import express from "express";
import helmet from "helmet";
import { timingSafeEqual } from "node:crypto";
import { metricSchema } from "./validation.js";

const timingSafeTokenMatch = (provided, expected) => {
  if (!expected) return true;
  if (typeof provided !== "string") return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(`Bearer ${expected}`);
  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
};

export function createApp({ store, io = null, token = "", corsOrigin = "http://localhost:5173" }) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((v) => v.trim()) }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/v1/agents", (_request, response) => {
    response.json({ agents: store.listAgents() });
  });

  app.get("/api/v1/agents/:agentId", (request, response) => {
    const agent = store.getAgent(request.params.agentId);
    if (!agent) return response.status(404).json({ error: "Machine introuvable" });
    return response.json(agent);
  });

  app.get("/api/v1/agents/:agentId/history", (request, response) => {
    if (!store.getAgent(request.params.agentId)) {
      return response.status(404).json({ error: "Machine introuvable" });
    }
    const limit = Number.parseInt(request.query.limit, 10) || 300;
    return response.json({
      agentId: request.params.agentId,
      points: store.getHistory(request.params.agentId, { limit }),
    });
  });

  app.post("/api/v1/metrics", (request, response) => {
    if (!timingSafeTokenMatch(request.get("authorization"), token)) {
      return response.status(401).json({ error: "Jeton d'agent invalide" });
    }

    const parsed = metricSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        error: "Mesure invalide",
        details: parsed.error.issues.map(({ path, message }) => ({ path: path.join("."), message })),
      });
    }

    const agent = store.ingest(parsed.data);
    io?.emit("agent:update", agent);
    return response.status(202).json({ accepted: true, agentId: parsed.data.agentId });
  });

  return app;
}

