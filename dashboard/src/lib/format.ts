export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const formatPercent = (value: number) => `${Math.round(value)}%`;

export function formatBytes(value: number, decimals = 1) {
  if (!Number.isFinite(value) || value <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To", "Po"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : decimals)} ${units[index]}`;
}

export const formatRate = (value: number) => `${formatBytes(value)}/s`;

export function formatFrequency(value: number) {
  if (!value) return "Indisponible";
  return value >= 1_000_000_000
    ? `${(value / 1_000_000_000).toFixed(2)} GHz`
    : `${Math.round(value / 1_000_000)} MHz`;
}

export function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

export function formatChartTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

