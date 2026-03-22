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

interface Props {
  data: ScenarioGrowthPoint[];
  retirementAge: number;
}

function formatBillions(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

const PYG = new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 });

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-sm shadow">
      <p className="font-medium mb-1">Edad {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {PYG.format(p.value)}</p>
      ))}
    </div>
  );
}

const LABELS: Record<string, string> = {
  pessimistic: "Pesimista",
  base: "Esperado",
  optimistic: "Optimista",
};

export default function FundGrowthChart({ data, retirementAge }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Crecimiento del fondo</h2>
      <p className="text-sm text-gray-500 mb-4">
        Fondo acumulado por edad hasta el retiro a los {retirementAge} años (3 escenarios)
      </p>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="age" tick={{ fontSize: 12 }} label={{ value: "Edad", position: "insideBottomRight", offset: -8, fontSize: 12 }} />
          <YAxis tickFormatter={formatBillions} tick={{ fontSize: 12 }} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => LABELS[value] ?? value} />
          <Area type="monotone" dataKey="pessimistic" name="pessimistic" stroke="#f97316" strokeWidth={1.5} fill="url(#grad-pessimistic)" strokeDasharray="4 2" />
          <Area type="monotone" dataKey="base" name="base" stroke="#3b82f6" strokeWidth={2} fill="url(#grad-base)" />
          <Area type="monotone" dataKey="optimistic" name="optimistic" stroke="#22c55e" strokeWidth={1.5} fill="url(#grad-optimistic)" strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
