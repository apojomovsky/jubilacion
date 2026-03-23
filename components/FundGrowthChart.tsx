"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScenarioGrowthPoint } from "@/lib/pension";
import type { FundScenario } from "@/components/ScenarioSelector";

interface Props {
  data: ScenarioGrowthPoint[];
  retirementAge: number;
  selectedScenario: FundScenario;
}

function formatBillions(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

import { formatPYG } from "@/lib/format";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-2 text-sm shadow text-gray-100">
      <p className="font-medium mb-1 text-gray-300">Edad {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatPYG(p.value)}
        </p>
      ))}
    </div>
  );
}

const LABELS: Record<string, string> = {
  pessimistic: "Pesimista",
  base: "Esperado",
  optimistic: "Optimista",
};

const GLOW: Record<FundScenario, string> = {
  pessimistic: "drop-shadow(0 0 6px rgba(249,115,22,0.7))",
  base: "drop-shadow(0 0 6px rgba(59,130,246,0.7))",
  optimistic: "drop-shadow(0 0 6px rgba(34,197,94,0.7))",
};

export default function FundGrowthChart({ data, retirementAge, selectedScenario }: Props) {
  function areaProps(key: FundScenario, color: string, dashArray?: string) {
    const isSelected = key === selectedScenario;
    return {
      dataKey: key,
      name: LABELS[key] ?? key,
      stroke: color,
      strokeWidth: isSelected ? 3 : 1,
      strokeOpacity: isSelected ? 1 : 0.25,
      fill: `url(#grad-${key})`,
      fillOpacity: isSelected ? 1 : 0.15,
      strokeDasharray: isSelected ? undefined : (dashArray ?? undefined),
      style: isSelected ? { filter: GLOW[key] } : undefined,
    };
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold text-gray-100">Crecimiento del fondo</h2>
      <p className="text-sm text-gray-400">
        Fondo acumulado por edad hasta el retiro a los {retirementAge} años · escenario seleccionado
        resaltado
      </p>
      <div className="mt-3">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-pessimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-optimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Edad",
                position: "insideBottomRight",
                offset: -8,
                fontSize: 12,
                fill: "#6b7280",
              }}
            />
            <YAxis
              tickFormatter={formatBillions}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value) => LABELS[value] ?? value} />
            <Area type="monotone" {...areaProps("optimistic", "#22c55e", "4 2")} />
            <Area type="monotone" {...areaProps("base", "#3b82f6")} />
            <Area type="monotone" {...areaProps("pessimistic", "#f97316", "4 2")} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
