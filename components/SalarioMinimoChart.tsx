"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalarioMinimoDataPoint, SalarioMinimoScenarios } from "@/lib/salarioMinimo";
import { projectSalarioMinimo } from "@/lib/salarioMinimo";

interface Props {
  historicalData: SalarioMinimoDataPoint[];
  scenarios: SalarioMinimoScenarios;
  targetYear: number;
}

const PYG = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

function formatM(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value != null);
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-sm shadow">
      <p className="font-medium mb-1">{label}</p>
      {items.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {PYG.format(p.value)}</p>
      ))}
    </div>
  );
}

export default function SalarioMinimoChart({ historicalData, scenarios, targetYear }: Props) {
  const { slow, moderate, fast } = scenarios;
  const baseYear = moderate.baseYear;

  // Build combined dataset: historical points + yearly projections from baseYear to targetYear
  const historicalByYear = new Map(historicalData.map((d) => [d.year, d.monthly_pyg]));

  const allYears = new Set<number>([
    ...historicalData.map((d) => d.year),
    ...Array.from({ length: targetYear - baseYear + 1 }, (_, i) => baseYear + i),
  ]);

  const chartData = Array.from(allYears)
    .sort((a, b) => a - b)
    .map((year) => {
      const historical = historicalByYear.get(year) ?? null;
      const isProjection = year >= baseYear;
      return {
        year,
        historical: historical,
        slow: isProjection ? projectSalarioMinimo({ currentValue: slow.baseValue, currentYear: baseYear, targetYear: year, annualGrowthRate: slow.annualGrowthRate }) : null,
        moderate: isProjection ? projectSalarioMinimo({ currentValue: moderate.baseValue, currentYear: baseYear, targetYear: year, annualGrowthRate: moderate.annualGrowthRate }) : null,
        fast: isProjection ? projectSalarioMinimo({ currentValue: fast.baseValue, currentYear: baseYear, targetYear: year, annualGrowthRate: fast.annualGrowthRate }) : null,
      };
    });

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        Datos históricos (puntos) y proyección hasta {targetYear} (líneas). Año base de proyección: {baseYear}.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatM} tick={{ fontSize: 11 }} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine x={baseYear} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: "hoy", position: "insideTopRight", fontSize: 11, fill: "#94a3b8" }} />
          <Line type="monotone" dataKey="historical" name="Histórico" stroke="#1e293b" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line type="monotone" dataKey="slow" name="Crecimiento lento" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls />
          <Line type="monotone" dataKey="moderate" name="Crecimiento histórico" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="fast" name="Crecimiento alto" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
