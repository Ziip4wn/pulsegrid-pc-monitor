import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { MetricsStore } from "./store.js";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(serverDirectory, "../../.env") });

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const store = new MetricsStore({
  historyLimit: Number.parseInt(process.env.HISTORY_LIMIT ?? "900", 10),
  offlineAfterMs: Number.parseInt(process.env.AGENT_OFFLINE_MS ?? "15000", 10),
});

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",") },
});
const app = createApp({
  store,
  io,
  token: process.env.MONITOR_TOKEN ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
});

io.on("connection", (socket) => {
  socket.emit("agents:snapshot", { agents: store.listAgents() });
});

const dashboardDist = join(serverDirectory, "../../dashboard/dist");
if (existsSync(dashboardDist)) {
  app.use(express.static(dashboardDist, { maxAge: "1h", etag: true }));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api") || request.path.startsWith("/socket.io")) return next();
    return response.sendFile(join(dashboardDist, "index.html"));
  });
}

httpServer.on("request", app);
httpServer.listen(port, () => {
  console.log(`PulseGrid API : http://localhost:${port}`);
  console.log(process.env.MONITOR_TOKEN ? "Authentification agent activée" : "Authentification agent désactivée (usage local uniquement)");
});

const shutdown = () => {
  io.close(() => httpServer.close(() => process.exit(0)));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

