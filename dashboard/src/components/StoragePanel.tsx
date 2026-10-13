import { Database, HardDrive } from "lucide-react";
import { formatBytes } from "../lib/format";
import type { DiskMetric } from "../types";

export function StoragePanel({ disks }: { disks: DiskMetric[] }) {
  return (
    <article className="panel storage-panel" id="storage">
      <div className="panel__header">
        <div>
          <span className="eyebrow"><Database size={14} /> Volumes montés</span>
          <h2>Stockage</h2>
        </div>
        <span className="panel-count">{disks.length} volume{disks.length > 1 ? "s" : ""}</span>
      </div>
      <div className="disk-list">
        {disks.length === 0 && <p className="muted-empty">Aucun volume détecté.</p>}
        {disks.map((disk, index) => (
          <div className="disk-row" key={`${disk.name}-${disk.mount}-${index}`}>
            <span className="disk-icon"><HardDrive size={19} /></span>
            <div className="disk-main">
              <div className="disk-title">
                <span><strong>{disk.name || disk.mount}</strong><small>{disk.mount} · {disk.type || "volume"}</small></span>
                <span><strong>{Math.round(disk.usagePercent)}%</strong><small>{formatBytes(disk.usableBytes)} libres</small></span>
              </div>
              <div className="disk-progress">
                <span
                  className={disk.usagePercent > 90 ? "danger" : disk.usagePercent > 75 ? "warning" : ""}
                  style={{ width: `${Math.min(disk.usagePercent, 100)}%` }}
                />
              </div>
              <div className="disk-caption">
                <span>{formatBytes(disk.usedBytes)} utilisés</span>
                <span>{formatBytes(disk.totalBytes)} au total</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

