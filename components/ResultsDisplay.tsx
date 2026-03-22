"use client";

import type { ProjectPensionResult } from "@/lib/pension";

interface Props {
  result: ProjectPensionResult;
  currentSalaryMinimo: number;
}

function formatPYG(value: number): string {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ResultsDisplay({ result, currentSalaryMinimo }: Props) {
  const { accumulatedFund, monthlyPayout, yearsContributing, yearsInRetirement } = result;
  const payoutInSalarios = monthlyPayout / currentSalaryMinimo;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Proyeccion</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label="Fondo acumulado al retiro"
          value={formatPYG(accumulatedFund)}
          sub={`Aportando durante ${yearsContributing} anos`}
        />
        <StatCard
          label="Renta mensual estimada"
          value={formatPYG(monthlyPayout)}
          sub={`Para ${yearsInRetirement} anos de retiro`}
        />
        <StatCard
          label="Renta en salarios minimos actuales"
          value={`${payoutInSalarios.toFixed(2)}x`}
          sub="Basado en el salario minimo ingresado"
        />
        <StatCard
          label="Total aportado"
          value={formatPYG(result.monthlyPayout * yearsInRetirement * 12 / 1)}
          sub="Estimado de pagos durante el retiro"
        />
      </div>
    </div>
  );
}
