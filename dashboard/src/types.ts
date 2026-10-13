export type ProcessMetric = {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryBytes: number;
};

export type DiskMetric = {
  name: string;
  mount: string;
  type: string;
  totalBytes: number;
  usableBytes: number;
  usedBytes: number;
  usagePercent: number;
};

export type NetworkInterfaceMetric = {
  name: string;
  displayName: string;
  macAddress?: string;
  ipv4: string[];
  rxBytes: number;
  txBytes: number;
};

export type Metric = {
  schemaVersion: 1;
  agentId: string;
  name: string;
  timestamp: string;
  system: {
    hostname: string;
    os: string;
    osVersion: string;
    architecture: string;
    uptimeSeconds: number;
    bootTimeEpochSeconds: number;
  };
  cpu: {
    usagePercent: number;
    logicalCores: number;
    physicalCores: number;
    frequencyHz: number;
    maxFrequencyHz: number;
    temperatureCelsius: number | null;
    loadAverage: number[];
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    swapTotalBytes: number;
    swapUsedBytes: number;
  };
  disks: DiskMetric[];
  network: {
    rxBytes: number;
    txBytes: number;
    rxBytesPerSecond: number;
    txBytesPerSecond: number;
    interfaces: NetworkInterfaceMetric[];
  };
  processes: ProcessMetric[];
};

export type Agent = {
  agentId: string;
  name: string;
  hostname: string;
  os: string;
  status: "online" | "offline";
  lastSeen: string;
  latest: Metric;
};

export type HistoryPoint = {
  timestamp: string;
  cpuPercent: number;
  temperatureCelsius: number | null;
  memoryPercent: number;
  memoryUsedBytes: number;
  networkRxBytesPerSecond: number;
  networkTxBytesPerSecond: number;
};

