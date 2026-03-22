"use client";

import type { SalarioMinimoScenarios } from "@/lib/salarioMinimo";
import type { SalarioScenario } from "@/components/ScenarioSelector";

interface Props {
  scenarios: SalarioMinimoScenarios;
  targetYear: number;
  monthlyPensionPayout: number; // payout for the selected fund scenario, nominal PYG
  selectedSalarioScenario: SalarioScenario;
  onSelectSalarioScenario: (s: SalarioScenario) => void;
}

import { formatPYG } from "@/lib/format";

function pct(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

interface ScenarioRowProps {
  label: string;
  growthRate: number;
  projectedSalario: number;
  monthlyPayout: number;
  selected: boolean;
  onClick: () => void;
}

function ScenarioRow({ label, growthRate, projectedSalario, monthlyPayout, selected, onClick }: ScenarioRowProps) {
  const multiple = monthlyPayout / projectedSalario;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`grid grid-cols-4 gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-all select-none ${
        selected
          ? "border-blue-300 bg-blue-50 shadow-sm ring-2 ring-blue-200 ring-offset-1"
          : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm"
      }`}
    >
      <div>
        <p className={`font-medium ${selected ? "text-blue-700" : "text-gray-700"}`}>
          {label}
          {selected && <span className="ml-1.5 text-blue-400">◉</span>}
        </p>
        <p className="text-xs text-gray-400">{pct(growthRate)} anual</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Salario mínimo proyectado</p>
        <p className="font-semibold">{formatPYG(projectedSalario)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Tu renta mensual</p>
        <p className="font-semibold">{formatPYG(monthlyPayout)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Equivalencia</p>
        <p className={`text-lg font-bold ${multiple >= 1 ? "text-green-600" : multiple >= 0.5 ? "text-yellow-600" : "text-red-500"}`}>
          {multiple.toFixed(2)}x
        </p>
      </div>
    </div>
  );
}

export default function FutureSalarioSection({ scenarios, targetYear, monthlyPensionPayout, selectedSalarioScenario, onSelectSalarioScenario }: Props) {
  const { slow, moderate, fast } = scenarios;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Poder adquisitivo al retiro</h2>
        <p className="text-sm text-gray-500 mt-1">
          Basado en el historial del salario mínimo entre {moderate.fromYear} y {moderate.toYear}{" "}
          ({moderate.dataPointCount} datos, fuente: MTESS / impuestospy.com), el crecimiento anual promedio fue del{" "}
          <strong>{pct(moderate.annualGrowthRate)}</strong>. Aplicando ese ritmo y variantes, el salario mínimo en {targetYear} rondará:
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Hacé clic en un escenario para seleccionarlo.</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wide">
          <span>Escenario sal. mínimo</span>
          <span>Sal. mínimo en {targetYear}</span>
          <span>Tu renta mensual</span>
          <span>Equivalencia</span>
        </div>
        <ScenarioRow
          label={slow.label}
          growthRate={slow.annualGrowthRate}
          projectedSalario={slow.projectedValue}
          monthlyPayout={monthlyPensionPayout}
          selected={selectedSalarioScenario === "slow"}
          onClick={() => onSelectSalarioScenario("slow")}
        />
        <ScenarioRow
          label={moderate.label}
          growthRate={moderate.annualGrowthRate}
          projectedSalario={moderate.projectedValue}
          monthlyPayout={monthlyPensionPayout}
          selected={selectedSalarioScenario === "moderate"}
          onClick={() => onSelectSalarioScenario("moderate")}
        />
        <ScenarioRow
          label={fast.label}
          growthRate={fast.annualGrowthRate}
          projectedSalario={fast.projectedValue}
          monthlyPayout={monthlyPensionPayout}
          selected={selectedSalarioScenario === "fast"}
          onClick={() => onSelectSalarioScenario("fast")}
        />
      </div>

      <p className="text-xs text-gray-400">
        A mayor crecimiento del salario mínimo, menor es el poder adquisitivo relativo de tu jubilación.
        El escenario "Alto" es el desfavorable para el jubilado.
      </p>
    </div>
  );
}
