import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartTime } from "../lib/format";
import type { HistoryPoint } from "../types";

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="chart-tooltip">
      <span>{formatChartTime(label)}</span>
      {payload.map((item) => (
        <strong key={item.name} style={{ color: item.color }}>
          {item.name === "cpuPercent" ? "CPU" : "Mémoire"} : {Math.round(item.value)}%
        </strong>
      ))}
    </div>
  );
}

export function PerformanceChart({ history }: { history: HistoryPoint[] }) {
  const hasData = history.length > 1;
  return (
    <article className="panel performance-panel" id="performance">
      <div className="panel__header">
        <div>
          <span className="eyebrow"><Activity size={14} /> Temps réel</span>
          <h2>Charge système</h2>
        </div>
        <div className="chart-legend" aria-label="Légende">
          <span><i className="legend-dot cpu" /> CPU</span>
          <span><i className="legend-dot memory" /> Mémoire</span>
        </div>
      </div>
      <div className="chart-wrap">
        {!hasData && <div className="chart-placeholder">Le graphique se dessine après deux mesures…</div>}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 12, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b8cff" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#9b8cff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#42d9c8" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#42d9c8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff0a" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatChartTime}
              tick={{ fill: "#6f7582", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={42}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: "#6f7582", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#ffffff20", strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="cpuPercent"
              stroke="#9b8cff"
              strokeWidth={2}
              fill="url(#cpuGradient)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="memoryPercent"
              stroke="#42d9c8"
              strokeWidth={2}
              fill="url(#memoryGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

