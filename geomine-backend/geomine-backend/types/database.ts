export type UserRole = "miner" | "it" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Machine {
  id: string;
  name: string;
  machine_type: "generator";
  location: string | null;
  status: "active" | "maintenance" | "decommissioned";
  phase_type: "single_phase" | "three_phase";
  created_at: string;
}

export interface ParameterDefinition {
  id: string;
  machine_type: "generator";
  key: string;
  label: string;
  unit: string | null;
  min_expected: number | null;
  max_expected: number | null;
  sort_order: number;
  active: boolean;
  is_cumulative: boolean;
}

export interface Reading {
  id: string;
  machine_id: string;
  parameter_id: string;
  value: number;
  recorded_at: string;
  entered_by: string;
  entry_method: "manual" | "sensor";
  flagged: boolean;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
  created_at: string;
}

export interface RefuelEvent {
  id: string;
  machine_id: string;
  liters_added: number;
  recorded_at: string;
  entered_by: string;
  notes: string | null;
  created_at: string;
}

export interface FaultEvent {
  id: string;
  machine_id: string;
  code: string;
  description: string | null;
  resolved: boolean;
  resolved_at: string | null;
  recorded_at: string;
  entered_by: string;
  created_at: string;
}
