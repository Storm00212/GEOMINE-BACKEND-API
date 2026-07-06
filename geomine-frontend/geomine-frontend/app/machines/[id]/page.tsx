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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold">{machine?.name}</h1>
      <p className="text-sm text-gray-500">{machine?.location}</p>

      {recommendation && <RecommendationCard recommendation={recommendation} />}

      {openFaults.length > 0 && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            {openFaults.length} open fault{openFaults.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-1 space-y-1 text-sm text-red-700">
            {openFaults.map((f) => (
              <li key={f.id}>
                {f.code}
                {f.description ? ` — ${f.description}` : ""}{" "}
                <span className="text-xs text-red-400">
                  ({new Date(f.recorded_at).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
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

      <MachineChart readings={readings} parameters={parameters} />
    </div>
  );
}
