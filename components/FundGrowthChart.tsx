"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FundGrowthPoint } from "@/lib/pension";

interface Props {
  data: FundGrowthPoint[];
  retirementAge: number;
}

function formatBillions(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-sm shadow">
      <p className="font-medium">Edad {label}</p>
      <p className="text-blue-600">
        {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(value)}
      </p>
    </div>
  );
}

export default function FundGrowthChart({ data, retirementAge }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Crecimiento del fondo</h2>
      <p className="text-sm text-gray-500 mb-4">
        Fondo acumulado por edad hasta el retiro a los {retirementAge} anos
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fundGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="age" tick={{ fontSize: 12 }} label={{ value: "Edad", position: "insideBottomRight", offset: -8, fontSize: 12 }} />
          <YAxis tickFormatter={formatBillions} tick={{ fontSize: 12 }} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="fund"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#fundGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
