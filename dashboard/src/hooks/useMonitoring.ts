import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Agent, HistoryPoint } from "../types";

const toHistoryPoint = (agent: Agent): HistoryPoint => {
  const metric = agent.latest;
  return {
    timestamp: metric.timestamp,
    cpuPercent: metric.cpu.usagePercent,
    temperatureCelsius: metric.cpu.temperatureCelsius,
    memoryPercent: metric.memory.totalBytes
      ? (metric.memory.usedBytes / metric.memory.totalBytes) * 100
      : 0,
    memoryUsedBytes: metric.memory.usedBytes,
    networkRxBytesPerSecond: metric.network.rxBytesPerSecond,
    networkTxBytesPerSecond: metric.network.txBytesPerSecond,
  };
};

export function useMonitoring() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const updateAgents = (incoming: Agent[]) => {
      setAgents(incoming);
      setSelectedId((current) => {
        if (current && incoming.some((agent) => agent.agentId === current)) return current;
        return incoming[0]?.agentId ?? null;
      });
    };

    fetch("/api/v1/agents")
      .then((response) => {
        if (!response.ok) throw new Error("API indisponible");
        return response.json() as Promise<{ agents: Agent[] }>;
      })
      .then(({ agents: initialAgents }) => {
        updateAgents(initialAgents);
        setError(null);
      })
      .catch(() => setError("Impossible de joindre le serveur PulseGrid."))
      .finally(() => setLoading(false));

    const socket = io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => {
      setConnected(true);
      setError(null);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setError("Connexion temps réel interrompue."));
    socket.on("agents:snapshot", ({ agents: snapshot }: { agents: Agent[] }) => updateAgents(snapshot));
    socket.on("agent:update", (updated: Agent) => {
      setAgents((current) => {
        const index = current.findIndex((agent) => agent.agentId === updated.agentId);
        if (index === -1) return [...current, updated].sort((a, b) => a.name.localeCompare(b.name));
        const next = [...current];
        next[index] = updated;
        return next;
      });
      setSelectedId((current) => current ?? updated.agentId);
      if (!selectedIdRef.current || selectedIdRef.current === updated.agentId) {
        setHistory((current) => [...current, toHistoryPoint(updated)].slice(-300));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/v1/agents/${encodeURIComponent(selectedId)}/history?limit=300`)
      .then((response) => response.json() as Promise<{ points: HistoryPoint[] }>)
      .then(({ points }) => {
        if (!cancelled) setHistory(points);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.agentId === selectedId) ?? null,
    [agents, selectedId],
  );

  return {
    agents,
    selectedAgent,
    selectedId,
    setSelectedId,
    history,
    connected,
    loading,
    error,
  };
}

