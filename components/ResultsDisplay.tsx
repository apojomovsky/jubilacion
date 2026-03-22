"use client";

import type { Scenarios } from "@/lib/pension";
import type { FundScenario } from "@/components/ScenarioSelector";

interface Props {
  scenarios: Scenarios;
  currentSalaryMinimo: number;
  spread: number;
  currentAge: number;
  retirementAge: number;
  selectedScenario: FundScenario;
  onSelectScenario: (s: FundScenario) => void;
}

import { formatPYG } from "@/lib/format";

interface ScenarioColumnProps {
  label: string;
  returnRate: number;
  accumulatedFund: number;
  monthlyPayout: number;
  totalReceived: number;
  payoutInSalarios: number;
  yearsInRetirement: number;
  selected: boolean;
  onClick: () => void;
}

function ScenarioColumn({
  label,
  returnRate,
  accumulatedFund,
  monthlyPayout,
  totalReceived,
  payoutInSalarios,
  yearsInRetirement,
  selected,
  onClick,
}: ScenarioColumnProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`flex flex-col gap-3 rounded-lg border p-4 cursor-pointer transition-all select-none ${
        selected
          ? "bg-blue-950 border-blue-500 ring-2 ring-blue-700 ring-offset-1 ring-offset-gray-900 shadow-md"
          : "bg-gray-800 border-gray-700 hover:border-blue-700 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${selected ? "text-blue-400" : "text-gray-300"}`}>
          {label}
          {selected && <span className="ml-1.5 text-blue-400">◉</span>}
        </span>
        <span className="text-xs text-gray-500">{(returnRate * 100).toFixed(1)}% neto</span>
      </div>
      <div>
        <p className="text-xs text-gray-500">Fondo al retiro</p>
        <p className="text-xl font-bold text-gray-100">{formatPYG(accumulatedFund)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Renta mensual</p>
        <p className="text-lg font-semibold text-gray-100">{formatPYG(monthlyPayout)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Renta vs. salario mínimo hoy</p>
        <p className="text-base font-medium text-gray-100">{payoutInSalarios.toFixed(2)}x</p>
        <p className="text-xs text-gray-600">Nominal, sin ajuste</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Total a recibir ({yearsInRetirement} años)</p>
        <p className="text-sm text-gray-100">{formatPYG(totalReceived)}</p>
      </div>
    </div>
  );
}

export default function ResultsDisplay({ scenarios, currentSalaryMinimo, spread, currentAge, retirementAge, selectedScenario, onSelectScenario }: Props) {
  const { pessimistic, base, optimistic } = scenarios;
  const { yearsContributing, yearsInRetirement } = base;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold text-gray-100">Proyección de tu fondo</h2>
          <span className="text-sm text-gray-500">
            {yearsContributing} años de aporte (de los {currentAge} a los {retirementAge}) · {yearsInRetirement} años de retiro · spread ±{(spread * 100).toFixed(0)}pp
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Hacé clic en un escenario para seleccionarlo — el gráfico y las secciones de abajo se actualizan.</p>
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
          selected={selectedScenario === "pessimistic"}
          onClick={() => onSelectScenario("pessimistic")}
        />
        <ScenarioColumn
          label="Esperado"
          returnRate={base.annualReturnRate ?? 0}
          accumulatedFund={base.accumulatedFund}
          monthlyPayout={base.monthlyPayout}
          totalReceived={base.monthlyPayout * yearsInRetirement * 12}
          payoutInSalarios={base.monthlyPayout / currentSalaryMinimo}
          yearsInRetirement={yearsInRetirement}
          selected={selectedScenario === "base"}
          onClick={() => onSelectScenario("base")}
        />
        <ScenarioColumn
          label="Optimista"
          returnRate={optimistic.annualReturnRate ?? 0}
          accumulatedFund={optimistic.accumulatedFund}
          monthlyPayout={optimistic.monthlyPayout}
          totalReceived={optimistic.monthlyPayout * yearsInRetirement * 12}
          payoutInSalarios={optimistic.monthlyPayout / currentSalaryMinimo}
          yearsInRetirement={yearsInRetirement}
          selected={selectedScenario === "optimistic"}
          onClick={() => onSelectScenario("optimistic")}
        />
      </div>
    </div>
  );
}
