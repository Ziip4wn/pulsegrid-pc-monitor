export class MetricsStore {
  constructor({ historyLimit = 900, offlineAfterMs = 15_000 } = {}) {
    this.historyLimit = historyLimit;
    this.offlineAfterMs = offlineAfterMs;
    this.agents = new Map();
  }

  ingest(metric) {
    const receivedAt = Date.now();
    const current = this.agents.get(metric.agentId) ?? {
      latest: null,
      history: [],
      receivedAt: 0,
    };

    current.latest = metric;
    current.receivedAt = receivedAt;
    current.history.push(this.toHistoryPoint(metric));

    if (current.history.length > this.historyLimit) {
      current.history.splice(0, current.history.length - this.historyLimit);
    }

    this.agents.set(metric.agentId, current);
    return this.describeAgent(metric.agentId, current, receivedAt);
  }

  toHistoryPoint(metric) {
    return {
      timestamp: metric.timestamp,
      cpuPercent: metric.cpu.usagePercent,
      temperatureCelsius: metric.cpu.temperatureCelsius ?? null,
      memoryPercent: metric.memory.totalBytes > 0
        ? (metric.memory.usedBytes / metric.memory.totalBytes) * 100
        : 0,
      memoryUsedBytes: metric.memory.usedBytes,
      networkRxBytesPerSecond: metric.network.rxBytesPerSecond,
      networkTxBytesPerSecond: metric.network.txBytesPerSecond,
    };
  }

  describeAgent(agentId, state, now = Date.now()) {
    const latest = state.latest;
    return {
      agentId,
      name: latest.name,
      hostname: latest.system.hostname,
      os: latest.system.os,
      status: now - state.receivedAt <= this.offlineAfterMs ? "online" : "offline",
      lastSeen: new Date(state.receivedAt).toISOString(),
      latest,
    };
  }

  listAgents(now = Date.now()) {
    return [...this.agents.entries()]
      .map(([id, state]) => this.describeAgent(id, state, now))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getAgent(agentId, now = Date.now()) {
    const state = this.agents.get(agentId);
    return state ? this.describeAgent(agentId, state, now) : null;
  }

  getHistory(agentId, { limit = 300 } = {}) {
    const history = this.agents.get(agentId)?.history ?? [];
    return history.slice(-Math.min(Math.max(limit, 1), this.historyLimit));
  }

  clear() {
    this.agents.clear();
  }
}

