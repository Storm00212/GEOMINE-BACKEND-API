import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine, ParameterDefinition, FaultEvent } from "@/types/database";
import type {
  GeneratorHealthSnapshot,
  OverloadDuration,
  PowerFactorTrend,
  RulEstimate,
  SpecificFuelConsumption,
  IdleDuration,
  MaintenanceRecommendation,
} from "@/types/metrics";
import {
  AppShell,
  Card,
  DividerLabel,
  AlertBox,
  HealthGauge,
  statusFromHealth,
} from "@/app/components/geomine-theme";
import MachineChart from "./machine-chart";
import MetricsPanel from "./metrics-panel";
import RecommendationCard from "./recommendation-card";

interface MachineDetail {
  machine: Machine | null;
  readings: any[];
  parameters: ParameterDefinition[];
  snapshot: GeneratorHealthSnapshot | null;
  overload: OverloadDuration | null;
  pfTrend: PowerFactorTrend | null;
  rul: RulEstimate | null;
  fuelConsumption: SpecificFuelConsumption | null;
  idle: IdleDuration | null;
  recommendation: MaintenanceRecommendation | null;
  openFaults: FaultEvent[];
}

export default async function MachinePage({ params }: { params: { id: string } }) {
  const {
    machine,
    readings,
    parameters,
    snapshot,
    overload,
    pfTrend,
    rul,
    fuelConsumption,
    idle,
    recommendation,
    openFaults,
  } = await backendGetJson<MachineDetail>(`/api/machines/${params.id}/detail`, {
    machine: null,
    readings: [],
    parameters: [],
    snapshot: null,
    overload: null,
    pfTrend: null,
    rul: null,
    fuelConsumption: null,
    idle: null,
    recommendation: null,
    openFaults: [],
  });

  const healthTone = statusFromHealth(snapshot?.health_index);

  return (
    <AppShell active="machines">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[19px] font-semibold">{machine?.name ?? "Generator"}</h1>
          <p className="mt-1 text-[13px] text-ink-dim">{machine?.location ?? "—"}</p>
        </div>
        {snapshot && (
          <div className="flex items-center gap-3 rounded-lg border border-line-soft bg-panel px-4 py-2">
            <HealthGauge value={snapshot.health_index} size={72} />
            <div className="text-right">
              <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-ink-faint">
                loading
              </div>
              <div className="font-mono text-[15px] font-semibold text-cyan">
                {snapshot.loading_pct ?? "—"}%
              </div>
              <div className="mt-1 font-mono text-[9.5px] text-ink-faint">
                priority {snapshot.maintenance_priority_score ?? "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      {recommendation && <RecommendationCard recommendation={recommendation} />}

      {openFaults.length > 0 && (
        <div className="mt-4 space-y-2">
          <AlertBox tint="red">
            <div>
              <div className="font-semibold text-red">{openFaults.length} open fault{openFaults.length > 1 ? "s" : ""}</div>
              <ul className="mt-1 space-y-0.5 text-[12.5px] text-red/90">
                {openFaults.map((f) => (
                  <li key={f.id}>
                    {f.code}
                    {f.description ? ` — ${f.description}` : ""}{" "}
                    <span className="font-mono text-[11px] text-red/60">
                      ({new Date(f.recorded_at).toLocaleDateString()})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertBox>
        </div>
      )}

      {snapshot && (
        <MetricsPanel
          snapshot={snapshot}
          overload={overload}
          pfTrend={pfTrend}
          rul={rul}
          fuelConsumption={fuelConsumption}
          idle={idle}
        />
      )}

      <DividerLabel>Parameter history</DividerLabel>
      <MachineChart readings={readings} parameters={parameters} />
    </AppShell>
  );
}
