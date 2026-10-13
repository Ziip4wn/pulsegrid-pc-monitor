import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { MetricsStore } from "../src/store.js";

const validMetric = {
  schemaVersion: 1,
  agentId: "test-agent",
  name: "Machine de test",
  timestamp: "2026-10-13T12:00:00.000Z",
  system: {
    hostname: "test-host",
    os: "TestOS",
    osVersion: "1.0",
    architecture: "x64",
    uptimeSeconds: 120,
    bootTimeEpochSeconds: 1_760_000_000,
  },
  cpu: {
    usagePercent: 32.5,
    logicalCores: 8,
    physicalCores: 4,
    frequencyHz: 3_600_000_000,
    maxFrequencyHz: 4_200_000_000,
    temperatureCelsius: null,
    loadAverage: [0.8, 0.6, 0.5],
  },
  memory: {
    totalBytes: 16_000_000_000,
    usedBytes: 8_000_000_000,
    availableBytes: 8_000_000_000,
    swapTotalBytes: 2_000_000_000,
    swapUsedBytes: 100_000_000,
  },
  disks: [],
  network: {
    rxBytes: 10_000,
    txBytes: 4_000,
    rxBytesPerSecond: 512,
    txBytesPerSecond: 128,
    interfaces: [],
  },
  processes: [],
};

test("protège l'ingestion puis rend la mesure disponible", async () => {
  const store = new MetricsStore();
  const app = createApp({ store, token: "secret-test" });

  await request(app).post("/api/v1/metrics").send(validMetric).expect(401);
  await request(app)
    .post("/api/v1/metrics")
    .set("Authorization", "Bearer secret-test")
    .send(validMetric)
    .expect(202);

  const response = await request(app).get("/api/v1/agents").expect(200);
  assert.equal(response.body.agents.length, 1);
  assert.equal(response.body.agents[0].latest.cpu.usagePercent, 32.5);
});

test("refuse une mesure qui ne respecte pas le contrat", async () => {
  const app = createApp({ store: new MetricsStore() });
  const response = await request(app)
    .post("/api/v1/metrics")
    .send({ schemaVersion: 1, agentId: "incomplet" })
    .expect(400);
  assert.equal(response.body.error, "Mesure invalide");
  assert.ok(response.body.details.length > 0);
});

