import type { MaintenanceRecommendation } from "@/types/metrics";
import { Card } from "@/app/components/geomine-theme";

const STYLES: Record<
  string,
  { border: string; bg: string; text: string; label: string; accent: string }
> = {
  healthy: {
    border: "border-[#2F4E3C]",
    bg: "bg-green-dim/50",
    text: "text-green",
    accent: "text-green",
    label: "Healthy",
  },
  watch: {
    border: "border-[#6B5228]",
    bg: "bg-amber-dim/40",
    text: "text-amber",
    accent: "text-amber",
    label: "Watch",
  },
  needs_maintenance: {
    border: "border-[#5A3230]",
    bg: "bg-red-dim/50",
    text: "text-red",
    accent: "text-red",
    label: "Maintenance recommended",
  },
  insufficient_data: {
    border: "border-line",
    bg: "bg-panel-alt",
    text: "text-ink-dim",
    accent: "text-ink-dim",
    label: "Not enough data yet",
  },
};

export default function RecommendationCard({
  recommendation,
}: {
  recommendation: MaintenanceRecommendation;
}) {
  const style = STYLES[recommendation.status] ?? STYLES.insufficient_data;

  return (
    <Card className={`mt-5 ${style.bg} ${style.border}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-[15px] font-semibold ${style.text}`}>{style.label}</p>
        <span className="font-mono text-[10.5px] text-ink-dim">
          CONFIDENCE: {recommendation.confidence.toUpperCase()} · {recommendation.sample_count}{" "}
          VISITS
          {recommendation.avg_interval_hours
            ? ` · ~${Math.round(recommendation.avg_interval_hours)}H APART`
            : ""}
        </span>
      </div>
      <ul className="mt-3 space-y-1.5 text-[12.5px] text-ink-dim">
        {recommendation.reasons.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className={style.accent}>—</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-[10.5px] text-ink-faint">
        Rule-based triage guidance from recent readings — not a diagnosis. Verify against the
        reasons above before acting.
      </p>
    </Card>
  );
}
