import { ArrowDownLeft, ArrowUpRight, Network, Wifi } from "lucide-react";
import { formatBytes, formatRate } from "../lib/format";
import type { Metric } from "../types";

export function NetworkPanel({ network }: { network: Metric["network"] }) {
  const activeInterfaces = network.interfaces.filter((item) => item.ipv4.length > 0).slice(0, 3);
  return (
    <article className="panel network-panel" id="network">
      <div className="panel__header">
        <div>
          <span className="eyebrow"><Network size={14} /> Trafic instantané</span>
          <h2>Réseau</h2>
        </div>
        <span className="live-badge"><i /> live</span>
      </div>
      <div className="network-rates">
        <div>
          <span className="rate-icon download"><ArrowDownLeft size={18} /></span>
          <span><small>Réception</small><strong>{formatRate(network.rxBytesPerSecond)}</strong></span>
        </div>
        <div>
          <span className="rate-icon upload"><ArrowUpRight size={18} /></span>
          <span><small>Envoi</small><strong>{formatRate(network.txBytesPerSecond)}</strong></span>
        </div>
      </div>
      <div className="network-total">
        <span>Téléchargé <strong>{formatBytes(network.rxBytes)}</strong></span>
        <i />
        <span>Envoyé <strong>{formatBytes(network.txBytes)}</strong></span>
      </div>
      <div className="interface-list">
        {activeInterfaces.length === 0 && <span className="muted-empty">Aucune interface active.</span>}
        {activeInterfaces.map((item) => (
          <div key={item.name} className="interface-row">
            <Wifi size={16} />
            <span><strong>{item.displayName || item.name}</strong><small>{item.ipv4.join(" · ")}</small></span>
            <i className="status-light" />
          </div>
        ))}
      </div>
    </article>
  );
}

