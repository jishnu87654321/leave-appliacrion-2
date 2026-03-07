export function formatDays(value: number | string, suffix = ""): string {
  const numeric = Number(value || 0);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  const unit = safeValue === 1 ? "day" : "days";
  return `${safeValue} ${unit}${suffix}`;
}

