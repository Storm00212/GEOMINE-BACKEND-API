import type { MaintenanceRecommendation } from "@/types/metrics";

const STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  healthy: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", label: "Healthy" },
  watch: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", label: "Watch" },
  needs_maintenance: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    label: "Maintenance recommended",
  },
  insufficient_data: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
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
    <div className={`mt-6 rounded-md border ${style.border} ${style.bg} px-4 py-3`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${style.text}`}>{style.label}</p>
        <span className="text-xs text-gray-400">
          Confidence: {recommendation.confidence} · {recommendation.sample_count} visits
          {recommendation.avg_interval_hours
            ? ` · ~${Math.round(recommendation.avg_interval_hours)}h apart`
            : ""}
        </span>
      </div>
      <ul className={`mt-2 space-y-1 text-sm ${style.text}`}>
        {recommendation.reasons.map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-400">
        Rule-based triage guidance from recent readings — not a diagnosis. Verify against the
        reasons above before acting.
      </p>
    </div>
  );
}
