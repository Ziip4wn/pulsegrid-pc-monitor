import { clamp } from "../lib/format";

export function ResourceGauge({ value, label, detail, color }: {
  value: number;
  label: string;
  detail: string;
  color: string;
}) {
  const percent = clamp(value);
  return (
    <div className="resource-gauge">
      <div
        className="gauge-ring"
        style={{ "--progress": `${percent * 3.6}deg`, "--gauge-color": color } as React.CSSProperties}
        role="img"
        aria-label={`${label}: ${Math.round(percent)}%`}
      >
        <div>
          <strong>{Math.round(percent)}<small>%</small></strong>
          <span>{label}</span>
        </div>
      </div>
      <p>{detail}</p>
    </div>
  );
}

