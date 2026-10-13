import { ChevronDown, ListFilter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatBytes } from "../lib/format";
import type { ProcessMetric } from "../types";

type SortKey = "cpuPercent" | "memoryBytes";

export function ProcessTable({ processes }: { processes: ProcessMetric[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("cpuPercent");
  const visible = useMemo(() => processes
    .filter((process) => process.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sort] - a[sort]), [processes, search, sort]);

  return (
    <article className="panel processes-panel" id="processes">
      <div className="panel__header process-header">
        <div>
          <span className="eyebrow"><ListFilter size={14} /> Activité</span>
          <h2>Processus principaux</h2>
        </div>
        <div className="table-actions">
          <label className="search-box">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher" />
          </label>
          <button
            className="sort-button"
            type="button"
            onClick={() => setSort((current) => current === "cpuPercent" ? "memoryBytes" : "cpuPercent")}
          >
            Trier : {sort === "cpuPercent" ? "CPU" : "RAM"} <ChevronDown size={14} />
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Processus</th><th>PID</th><th>CPU</th><th>Mémoire</th></tr></thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={4} className="muted-empty">Aucun processus correspondant.</td></tr>}
            {visible.map((process, index) => (
              <tr key={`${process.pid}-${process.name}`}>
                <td><span className={`process-avatar avatar-${index % 6}`}>{process.name.slice(0, 1).toUpperCase()}</span><strong>{process.name}</strong></td>
                <td className="mono">{process.pid}</td>
                <td><span className="cell-meter"><i style={{ width: `${Math.min(process.cpuPercent, 100)}%` }} /></span>{process.cpuPercent.toFixed(1)}%</td>
                <td>{formatBytes(process.memoryBytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

