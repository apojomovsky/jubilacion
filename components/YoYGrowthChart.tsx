"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalarioMinimoDataPoint } from "@/lib/salarioMinimo";

interface Props {
  historicalData: SalarioMinimoDataPoint[];
  historicalCAGR: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-2 text-sm shadow text-gray-100">
      <p className="font-medium">{label}</p>
      <p>{payload[0].value.toFixed(1)}% de crecimiento</p>
    </div>
  );
}

export default function YoYGrowthChart({ historicalData, historicalCAGR }: Props) {
  const sorted = [...historicalData].sort((a, b) => a.year - b.year);

  const data = sorted.slice(1).map((d, i) => {
    const prev = sorted[i];
    // Only compute YoY for consecutive years (gap ≤ 2 to handle minor gaps)
    if (d.year - prev.year > 2) return null;
    const rate = ((d.monthly_pyg / prev.monthly_pyg) - 1) * 100;
    return { year: `${prev.year}–${String(d.year).slice(2)}`, rate: parseFloat(rate.toFixed(1)) };
  }).filter(Boolean) as { year: string; rate: number }[];

  const avgLine = historicalCAGR * 100;

  return (
    <div>
      <p className="text-sm text-gray-400 mb-3">
        Crecimiento año a año del salario mínimo. La línea punteada es el promedio histórico ({avgLine.toFixed(1)}% anual).
        La varianza justifica el uso de escenarios en lugar de una sola proyección.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#6b7280" }} interval={2} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#6b7280" }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avgLine} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: `CAGR ${avgLine.toFixed(1)}%`, position: "insideTopRight", fontSize: 11, fill: "#3b82f6" }} />
          <Bar dataKey="rate" name="Crecimiento YoY" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.rate >= avgLine ? "#3b82f6" : "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
