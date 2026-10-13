import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { clamp } from "../lib/format";

type Props = {
  label: string;
  value: string;
  detail: ReactNode;
  percent?: number;
  icon: LucideIcon;
  tone: "violet" | "cyan" | "green" | "orange";
};

export function StatCard({ label, value, detail, percent, icon: Icon, tone }: Props) {
  const normalized = percent == null ? 0 : clamp(percent);
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card__head">
        <span className="stat-card__icon"><Icon size={18} strokeWidth={2} /></span>
        <span className="stat-card__label">{label}</span>
        {percent != null && <span className="stat-card__percent">{Math.round(normalized)}%</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__detail">{detail}</div>
      {percent != null && (
        <div className="mini-progress" aria-label={`${label}: ${Math.round(normalized)}%`}>
          <span style={{ width: `${normalized}%` }} />
        </div>
      )}
    </article>
  );
}

