import {
  Activity,
  Bell,
  Boxes,
  ChevronDown,
  CircleGauge,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  MemoryStick,
  Menu,
  Network,
  Radio,
  Server,
  Settings,
  ShieldCheck,
  Thermometer,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NetworkPanel } from "./components/NetworkPanel";
import { PerformanceChart } from "./components/PerformanceChart";
import { ProcessTable } from "./components/ProcessTable";
import { ResourceGauge } from "./components/ResourceGauge";
import { StatCard } from "./components/StatCard";
import { StoragePanel } from "./components/StoragePanel";
import { useMonitoring } from "./hooks/useMonitoring";
import {
  formatBytes,
  formatFrequency,
  formatPercent,
  formatRate,
  formatUptime,
} from "./lib/format";

const navItems = [
  { href: "#overview", label: "Vue d'ensemble", icon: CircleGauge },
  { href: "#performance", label: "Performances", icon: Activity },
  { href: "#storage", label: "Stockage", icon: Database },
  { href: "#network", label: "Réseau", icon: Network },
  { href: "#processes", label: "Processus", icon: Boxes },
];

function Brand() {
  return (
    <a className="brand" href="#overview" aria-label="PulseGrid, accueil">
      <span className="brand-mark"><i /><i /><i /><i /></span>
      <span><strong>Pulse</strong>Grid</span>
    </a>
  );
}

function EmptyState({ loading, error }: { loading: boolean; error: string | null }) {
  const [copied, setCopied] = useState(false);
  const command = "npm run agent:run";
  const copy = async () => {
    await navigator.clipboard?.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <main className="empty-state">
      <div className="empty-orbit" aria-hidden="true">
        <span><Cpu size={28} /></span>
        <i /><i /><i />
      </div>
      <span className="eyebrow"><Radio size={14} /> {loading ? "Recherche en cours" : "Prêt à surveiller"}</span>
      <h1>{error ? "Le serveur ne répond pas" : "Connectez votre première machine"}</h1>
      <p>
        {error
          ? "Vérifiez que l'API Node.js est lancée, puis rechargez la page."
          : "Lancez l'agent Java sur le PC à observer. Les premières mesures apparaîtront automatiquement ici."}
      </p>
      {!error && (
        <button className="command-box" type="button" onClick={copy} title="Copier la commande">
          <span>$</span><code>{command}</code><small>{copied ? "Copié !" : "Copier"}</small>
        </button>
      )}
      <div className="empty-features">
        <span><ShieldCheck size={16} /> Données locales</span>
        <span><Zap size={16} /> Temps réel</span>
        <span><Server size={16} /> Multi-machines</span>
      </div>
    </main>
  );
}

export default function App() {
  const { agents, selectedAgent, selectedId, setSelectedId, history, connected, loading, error } = useMonitoring();
  const [mobileNav, setMobileNav] = useState(false);
  const [, setClockTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const isOnline = selectedAgent
    ? Date.now() - new Date(selectedAgent.lastSeen).getTime() < 15_000
    : false;
  const metric = selectedAgent?.latest;
  const memoryPercent = metric && metric.memory.totalBytes
    ? (metric.memory.usedBytes / metric.memory.totalBytes) * 100
    : 0;
  const diskTotal = metric?.disks.reduce((sum, disk) => sum + disk.totalBytes, 0) ?? 0;
  const diskUsed = metric?.disks.reduce((sum, disk) => sum + disk.usedBytes, 0) ?? 0;
  const diskPercent = diskTotal ? (diskUsed / diskTotal) * 100 : 0;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="mobile-close" type="button" onClick={() => setMobileNav(false)} aria-label="Fermer le menu"><X /></button>
        </div>
        <nav>
          <span className="nav-caption">Monitoring</span>
          {navItems.map(({ href, label, icon: Icon }, index) => (
            <a key={href} href={href} className={index === 0 ? "active" : ""} onClick={() => setMobileNav(false)}>
              <Icon size={18} /><span>{label}</span>
            </a>
          ))}
          <span className="nav-caption nav-caption--second">Système</span>
          <a href="#system" onClick={() => setMobileNav(false)}><Settings size={18} /><span>Informations</span></a>
        </nav>
        <div className="sidebar-card">
          <span className="sidebar-card__icon"><ShieldCheck size={18} /></span>
          <div><strong>Supervision locale</strong><p>Vos données restent sur votre réseau.</p></div>
        </div>
        <div className="sidebar-footer">
          <span className={`api-light ${connected ? "online" : ""}`} />
          <span><strong>Serveur Node.js</strong><small>{connected ? "Connecté" : "Reconnexion…"}</small></span>
          <span className="version">v1.0</span>
        </div>
      </aside>

      {mobileNav && <button className="nav-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setMobileNav(false)} />}

      <section className="workspace">
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setMobileNav(true)} aria-label="Ouvrir le menu"><Menu /></button>
          <div className="topbar-title">
            <span className="mobile-brand"><Brand /></span>
            <div><span>Centre de contrôle</span><strong>{selectedAgent?.name ?? "PulseGrid"}</strong></div>
          </div>
          <div className="topbar-actions">
            {agents.length > 0 && (
              <label className="machine-select">
                <Server size={16} />
                <select value={selectedId ?? ""} onChange={(event) => setSelectedId(event.target.value)} aria-label="Machine surveillée">
                  {agents.map((agent) => <option value={agent.agentId} key={agent.agentId}>{agent.name}</option>)}
                </select>
                <ChevronDown size={14} />
              </label>
            )}
            <button className="icon-button" type="button" aria-label="Notifications"><Bell size={18} /><i /></button>
            {selectedAgent && (
              <div className="machine-status">
                <span className={isOnline ? "online" : "offline"} />
                <div><strong>{isOnline ? "En ligne" : "Hors ligne"}</strong><small>{selectedAgent.hostname}</small></div>
              </div>
            )}
          </div>
        </header>

        {!metric ? <EmptyState loading={loading} error={error} /> : (
          <main className="dashboard" id="overview">
            <section className="welcome-row">
              <div>
                <span className="eyebrow"><Gauge size={14} /> Vue d'ensemble</span>
                <h1>Tout fonctionne <em>{isOnline ? "normalement" : "hors connexion"}</em></h1>
                <p>Dernière mesure reçue à {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(selectedAgent.lastSeen))}.</p>
              </div>
              <div className={`health-pill ${isOnline ? "healthy" : "unhealthy"}`}>
                <span><i /></span>
                <div><small>État global</small><strong>{isOnline ? "Système stable" : "Agent indisponible"}</strong></div>
              </div>
            </section>

            <section className="stats-grid">
              <StatCard
                label="Processeur"
                value={formatPercent(metric.cpu.usagePercent)}
                detail={`${metric.cpu.logicalCores} cœurs logiques · ${formatFrequency(metric.cpu.frequencyHz)}`}
                percent={metric.cpu.usagePercent}
                icon={Cpu}
                tone="violet"
              />
              <StatCard
                label="Mémoire vive"
                value={formatBytes(metric.memory.usedBytes)}
                detail={`${formatBytes(metric.memory.availableBytes)} disponibles sur ${formatBytes(metric.memory.totalBytes)}`}
                percent={memoryPercent}
                icon={MemoryStick}
                tone="cyan"
              />
              <StatCard
                label="Température"
                value={metric.cpu.temperatureCelsius != null && metric.cpu.temperatureCelsius > 0 ? `${Math.round(metric.cpu.temperatureCelsius)}°C` : "N/D"}
                detail={metric.cpu.temperatureCelsius != null && metric.cpu.temperatureCelsius > 0 ? "Capteur processeur" : "Capteur non exposé par l'OS"}
                percent={metric.cpu.temperatureCelsius != null && metric.cpu.temperatureCelsius > 0 ? metric.cpu.temperatureCelsius : undefined}
                icon={Thermometer}
                tone="orange"
              />
              <StatCard
                label="Réseau"
                value={formatRate(metric.network.rxBytesPerSecond)}
                detail={`Envoi ${formatRate(metric.network.txBytesPerSecond)}`}
                icon={Wifi}
                tone="green"
              />
            </section>

            <section className="primary-grid">
              <PerformanceChart history={history} />
              <article className="panel resources-panel">
                <div className="panel__header">
                  <div><span className="eyebrow"><CircleGauge size={14} /> Instantané</span><h2>Ressources</h2></div>
                </div>
                <div className="gauge-grid">
                  <ResourceGauge value={metric.cpu.usagePercent} label="CPU" detail={`${metric.cpu.physicalCores} cœurs physiques`} color="#9b8cff" />
                  <ResourceGauge value={memoryPercent} label="RAM" detail={`${formatBytes(metric.memory.usedBytes)} utilisés`} color="#42d9c8" />
                  <ResourceGauge value={diskPercent} label="Disque" detail={`${formatBytes(diskUsed)} utilisés`} color="#72e58e" />
                </div>
                <div className="load-average">
                  <span>Charge moyenne</span>
                  {metric.cpu.loadAverage.map((load, index) => <strong key={index}>{load.toFixed(2)}<small>{["1 min", "5 min", "15 min"][index]}</small></strong>)}
                </div>
              </article>
            </section>

            <section className="secondary-grid">
              <StoragePanel disks={metric.disks} />
              <NetworkPanel network={metric.network} />
            </section>

            <ProcessTable processes={metric.processes} />

            <article className="panel system-panel" id="system">
              <div><span className="system-icon"><Server size={20} /></span><span><small>Nom d'hôte</small><strong>{metric.system.hostname}</strong></span></div>
              <div><span><small>Système</small><strong>{metric.system.os} {metric.system.osVersion}</strong></span></div>
              <div><span><small>Architecture</small><strong>{metric.system.architecture}</strong></span></div>
              <div><span><small>Disponibilité</small><strong>{formatUptime(metric.system.uptimeSeconds)}</strong></span></div>
              <span className="system-secure"><ShieldCheck size={15} /> Agent v1</span>
            </article>
          </main>
        )}
      </section>
    </div>
  );
}

