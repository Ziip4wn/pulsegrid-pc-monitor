import assert from "node:assert/strict";
import { test } from "node:test";
import { MetricsStore } from "../src/store.js";

const metric = (cpu = 42) => ({
  schemaVersion: 1,
  agentId: "pc-test",
  name: "PC Test",
  timestamp: new Date().toISOString(),
  system: { hostname: "pc-test", os: "TestOS", uptimeSeconds: 10 },
  cpu: { usagePercent: cpu, temperatureCelsius: null },
  memory: { totalBytes: 100, usedBytes: 40 },
  network: { rxBytesPerSecond: 12, txBytesPerSecond: 5 },
});

test("stocke la dernière mesure et limite l'historique", () => {
  const store = new MetricsStore({ historyLimit: 2 });
  store.ingest(metric(10));
  store.ingest(metric(20));
  store.ingest(metric(30));
  assert.equal(store.getAgent("pc-test").latest.cpu.usagePercent, 30);
  assert.deepEqual(store.getHistory("pc-test").map((point) => point.cpuPercent), [20, 30]);
});

test("passe une machine hors ligne après le délai", () => {
  const store = new MetricsStore({ offlineAfterMs: 100 });
  store.ingest(metric());
  const state = store.agents.get("pc-test");
  assert.equal(store.getAgent("pc-test", state.receivedAt + 99).status, "online");
  assert.equal(store.getAgent("pc-test", state.receivedAt + 101).status, "offline");
});

