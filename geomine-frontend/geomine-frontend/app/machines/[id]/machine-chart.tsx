"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ParameterDefinition } from "@/types/database";

interface ReadingRow {
  id: string;
  value: number;
  recorded_at: string;
  flagged: boolean;
  parameter_id: string;
}

export default function MachineChart({
  readings,
  parameters,
}: {
  readings: ReadingRow[];
  parameters: ParameterDefinition[];
}) {
  const [paramId, setParamId] = useState(parameters[0]?.id ?? "");

  const chartData = useMemo(
    () =>
      readings
        .filter((r) => r.parameter_id === paramId)
        .map((r) => ({
          time: new Date(r.recorded_at).toLocaleDateString(),
          value: r.value,
        })),
    [readings, paramId]
  );

  const stats = useMemo(() => {
    const values = readings.filter((r) => r.parameter_id === paramId).map((r) => r.value);
    if (values.length === 0) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return {
      mean: mean.toFixed(2),
      stddev: Math.sqrt(variance).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      count: values.length,
    };
  }, [readings, paramId]);

  const selectedParam = parameters.find((p) => p.id === paramId);

  return (
    <div className="mt-6">
      <select
        value={paramId}
        onChange={(e) => setParamId(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        {parameters.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {stats && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          <MiniStat label="Mean" value={stats.mean} />
          <MiniStat label="Volatility (σ)" value={stats.stddev} />
          <MiniStat label="Min / Max" value={`${stats.min} / ${stats.max}`} />
          <MiniStat label="Readings" value={String(stats.count)} />
        </div>
      )}

      <div className="mt-6 h-72 rounded-md border border-gray-200 bg-white p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis
                fontSize={12}
                label={{
                  value: selectedParam?.unit ?? "",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                }}
              />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-gray-400">
            No readings logged for this parameter yet.
          </p>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
