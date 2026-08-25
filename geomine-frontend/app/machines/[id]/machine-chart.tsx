"use client";

import { useState, useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import type { ParameterDefinition } from "@/types/database";
import { Card, DividerLabel, MetricTile, SelectInput } from "@/app/components/geomine-theme";

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

  const series = useMemo(
    () => readings.filter((r) => r.parameter_id === paramId),
    [readings, paramId]
  );

  const chartData = useMemo(
    () =>
      series.map((r) => ({
        time: new Date(r.recorded_at).toLocaleDateString(),
        full: new Date(r.recorded_at).toLocaleString(),
        value: r.value,
        flagged: r.flagged,
      })),
    [series]
  );

  const selectedParam = parameters.find((p) => p.id === paramId);

  const stats = useMemo(() => {
    const values = series.map((r) => r.value);
    if (values.length === 0) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return {
      mean: mean.toFixed(2),
      stddev: Math.sqrt(variance).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      count: values.length,
      flagged: series.filter((r) => r.flagged).length,
    };
  }, [series]);

  const flagBand = useMemo(() => {
    const p = selectedParam;
    if (!p || p.min_expected === null || p.max_expected === null) return null;
    return { min: p.min_expected, max: p.max_expected };
  }, [selectedParam]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DividerLabel>Parameter history</DividerLabel>
        <div className="w-full sm:w-64">
          <SelectInput value={paramId} onChange={(e) => setParamId(e.target.value)}>
            {parameters.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>

      {stats && (
        <div className="mb-4 mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Mean" value={stats.mean} tone="cyan" />
          <MetricTile label="Volatility (σ)" value={stats.stddev} />
          <MetricTile label="Min / Max" value={`${stats.min} / ${stats.max}`} />
          <MetricTile
            label="Readings"
            value={`${stats.count}${stats.flagged ? ` · ${stats.flagged}!` : ""}`}
            tone={stats.flagged ? "red" : "neutral"}
          />
        </div>
      )}

      <div className="h-72 w-full rounded-md border border-line-soft bg-base/40 p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="gmLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4FC3D9" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#4FC3D9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C313C" vertical={false} />
              {flagBand && (
                <>
                  <ReferenceLine y={flagBand.max} stroke="#E0574F" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <ReferenceLine y={flagBand.min} stroke="#E0574F" strokeDasharray="4 4" strokeOpacity={0.5} />
                </>
              )}
              <XAxis
                dataKey="time"
                fontSize={11}
                stroke="#5C6270"
                tickLine={false}
              />
              <YAxis
                fontSize={11}
                stroke="#5C6270"
                tickLine={false}
                width={44}
                label={{
                  value: selectedParam?.unit ?? "",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  fill: "#8D95A3",
                }}
              />
              <Tooltip
                contentStyle={{ background: "#21252D", border: "1px solid #363C48", borderRadius: 8, color: "#EDEFF3" }}
                labelStyle={{ color: "#8D95A3" }}
                itemStyle={{ color: "#4FC3D9" }}
                formatter={(v: any) => [`${v} ${selectedParam?.unit ?? ""}`, selectedParam?.label ?? "value"]}
                labelFormatter={(l) => chartData.find((d) => d.time === l)?.full ?? l}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4FC3D9"
                strokeWidth={2}
                fill="url(#gmLine)"
                dot={{ r: 2, fill: "#4FC3D9", strokeWidth: 0 }}
                activeDot={{ r: 4, fill: "#4FC3D9", stroke: "#0B0D12", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-ink-faint">
            No readings logged for this parameter yet.
          </div>
        )}
      </div>
      <p className="mt-2 font-mono text-[10px] text-ink-faint">
        Dashed red lines mark the expected operating band for this parameter.
      </p>
    </Card>
  );
}
