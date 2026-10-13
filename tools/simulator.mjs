import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const serverUrl = (process.env.PULSEGRID_SERVER_URL ?? "http://localhost:4000").replace(/\/$/, "");
const token = process.env.MONITOR_TOKEN ?? "";
const startedAt = Date.now();
let rxBytes = 8_420_000_000;
let txBytes = 2_170_000_000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wave = (period, amplitude, offset, phase = 0) => offset + Math.sin(Date.now() / period + phase) * amplitude;

function createMetric() {
  const cpu = clamp(wave(4_200, 16, 37) + Math.random() * 8, 4, 92);
  const memoryPercent = clamp(wave(17_000, 4, 61), 35, 82);
  const rxRate = Math.max(0, wave(2_800, 1_800_000, 2_400_000) + Math.random() * 350_000);
  const txRate = Math.max(0, wave(4_100, 550_000, 720_000, 1.2) + Math.random() * 100_000);
  rxBytes += rxRate * 2;
  txBytes += txRate * 2;
  const totalMemory = 32 * 1024 ** 3;
  const processValues = [
    ["chrome", 3824, cpu * 0.24, 2.4 * 1024 ** 3],
    ["code", 7412, cpu * 0.18, 1.3 * 1024 ** 3],
    ["java", 9208, cpu * 0.13, 840 * 1024 ** 2],
    ["node", 10640, cpu * 0.09, 412 * 1024 ** 2],
    ["Discord", 6316, cpu * 0.07, 354 * 1024 ** 2],
    ["explorer", 2180, cpu * 0.025, 188 * 1024 ** 2],
    ["Antimalware Service", 1132, cpu * 0.018, 246 * 1024 ** 2],
    ["Spotify", 8870, cpu * 0.012, 174 * 1024 ** 2],
  ];

  return {
    schemaVersion: 1,
    agentId: "demo-workstation",
    name: "Station principale",
    timestamp: new Date().toISOString(),
    system: {
      hostname: "DESKTOP-PULSE",
      os: "Windows",
      osVersion: "11 Pro",
      architecture: "amd64",
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) + 187_420,
      bootTimeEpochSeconds: Math.floor(startedAt / 1000) - 187_420,
    },
    cpu: {
      usagePercent: Number(cpu.toFixed(2)),
      logicalCores: 16,
      physicalCores: 8,
      frequencyHz: 4_240_000_000,
      maxFrequencyHz: 5_100_000_000,
      temperatureCelsius: Number(clamp(47 + cpu * 0.26 + Math.random() * 2, 44, 82).toFixed(1)),
      loadAverage: [cpu / 17, cpu / 19, cpu / 21].map((value) => Number(value.toFixed(2))),
    },
    memory: {
      totalBytes: totalMemory,
      usedBytes: Math.round(totalMemory * memoryPercent / 100),
      availableBytes: Math.round(totalMemory * (1 - memoryPercent / 100)),
      swapTotalBytes: 5 * 1024 ** 3,
      swapUsedBytes: 1.1 * 1024 ** 3,
    },
    disks: [
      { name: "Windows", mount: "C:\\", type: "NTFS", totalBytes: 1024 ** 4, usableBytes: 397 * 1024 ** 3, usedBytes: 627 * 1024 ** 3, usagePercent: 61.23 },
      { name: "Projets", mount: "D:\\", type: "NTFS", totalBytes: 2 * 1024 ** 4, usableBytes: 1.18 * 1024 ** 4, usedBytes: 0.82 * 1024 ** 4, usagePercent: 41 },
    ],
    network: {
      rxBytes: Math.round(rxBytes),
      txBytes: Math.round(txBytes),
      rxBytesPerSecond: Number(rxRate.toFixed(2)),
      txBytesPerSecond: Number(txRate.toFixed(2)),
      interfaces: [
        { name: "eth0", displayName: "Intel 2.5Gb Ethernet", macAddress: "AA:BB:CC:DD:EE:01", ipv4: ["192.168.1.42"], rxBytes: Math.round(rxBytes), txBytes: Math.round(txBytes) },
        { name: "wlan0", displayName: "Wi-Fi 6E", macAddress: "AA:BB:CC:DD:EE:02", ipv4: ["192.168.1.87"], rxBytes: 190_000_000, txBytes: 42_000_000 },
      ],
    },
    processes: processValues.map(([name, pid, processCpu, processMemory]) => ({
      name,
      pid,
      cpuPercent: Number((processCpu + Math.random()).toFixed(2)),
      memoryBytes: Math.round(processMemory),
    })),
  };
}

async function waitForServer() {
  for (;;) {
    try {
      const response = await fetch(`${serverUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Le serveur de développement démarre en parallèle.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function sendMetric() {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${serverUrl}/api/v1/metrics`, {
    method: "POST",
    headers,
    body: JSON.stringify(createMetric()),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

await waitForServer();
console.log(`Simulateur connecté à ${serverUrl}`);
await sendMetric();
const timer = setInterval(() => sendMetric().catch((error) => console.error(error.message)), 2_000);
process.on("SIGINT", () => { clearInterval(timer); process.exit(0); });
process.on("SIGTERM", () => { clearInterval(timer); process.exit(0); });

