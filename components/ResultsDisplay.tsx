"use client";

import type { Scenarios } from "@/lib/pension";

interface Props {
  scenarios: Scenarios;
  currentSalaryMinimo: number;
  spread: number;
  currentAge: number;
  retirementAge: number;
}

function formatPYG(value: number): string {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ScenarioColumnProps {
  label: string;
  returnRate: number;
  accumulatedFund: number;
  monthlyPayout: number;
  totalReceived: number;
  payoutInSalarios: number;
  yearsInRetirement: number;
  highlight?: boolean;
}

function ScenarioColumn({
  label,
  returnRate,
  accumulatedFund,
  monthlyPayout,
  totalReceived,
  payoutInSalarios,
  yearsInRetirement,
  highlight,
}: ScenarioColumnProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 ${highlight ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${highlight ? "text-blue-700" : "text-gray-600"}`}>{label}</span>
        <span className="text-xs text-gray-400">{(returnRate * 100).toFixed(1)}% rendimiento neto</span>
      </div>
      <div>
        <p className="text-xs text-gray-500">Fondo al retiro</p>
        <p className="text-xl font-bold">{formatPYG(accumulatedFund)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Renta mensual</p>
        <p className="text-lg font-semibold">{formatPYG(monthlyPayout)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Renta vs. salario mínimo hoy</p>
        <p className="text-base font-medium">{payoutInSalarios.toFixed(2)}x</p>
        <p className="text-xs text-gray-400">Nominal, sin ajuste por inflación</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Total a recibir ({yearsInRetirement} años)</p>
        <p className="text-sm text-gray-700">{formatPYG(totalReceived)}</p>
      </div>
    </div>
  );
}

export default function ResultsDisplay({ scenarios, currentSalaryMinimo, spread, currentAge, retirementAge }: Props) {
  const { pessimistic, base, optimistic } = scenarios;
  const { yearsContributing, yearsInRetirement } = base;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">Proyección</h2>
        <span className="text-sm text-gray-400">
          {yearsContributing} años restantes de aporte (de los {currentAge} a los {retirementAge}), {yearsInRetirement} años de retiro. Spread: ±{(spread * 100).toFixed(0)}pts.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ScenarioColumn
          label="Pesimista"
          returnRate={pessimistic.annualReturnRate ?? 0}
          accumulatedFund={pessimistic.accumulatedFund}
          monthlyPayout={pessimistic.monthlyPayout}
          totalReceived={pessimistic.monthlyPayout * yearsInRetirement * 12}
          payoutInSalarios={pessimistic.monthlyPayout / currentSalaryMinimo}
          yearsInRetirement={yearsInRetirement}
        />
        <ScenarioColumn
          label="Esperado"
          returnRate={base.annualReturnRate ?? 0}
          accumulatedFund={base.accumulatedFund}
          monthlyPayout={base.monthlyPayout}
          totalReceived={base.monthlyPayout * yearsInRetirement * 12}
          payoutInSalarios={base.monthlyPayout / currentSalaryMinimo}
          yearsInRetirement={yearsInRetirement}
          highlight
        />
        <ScenarioColumn
          label="Optimista"
          returnRate={optimistic.annualReturnRate ?? 0}
          accumulatedFund={optimistic.accumulatedFund}
          monthlyPayout={optimistic.monthlyPayout}
          totalReceived={optimistic.monthlyPayout * yearsInRetirement * 12}
          payoutInSalarios={optimistic.monthlyPayout / currentSalaryMinimo}
          yearsInRetirement={yearsInRetirement}
        />
      </div>
    </div>
  );
}
