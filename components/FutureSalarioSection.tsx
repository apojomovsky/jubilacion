"use client";

import type { SalarioMinimoScenarios } from "@/lib/salarioMinimo";
import type { SalarioScenario } from "@/components/ScenarioSelector";

interface Props {
  scenarios: SalarioMinimoScenarios;
  targetYear: number;
  monthlyPensionPayout: number; // payout for the selected fund scenario, nominal PYG
  selectedSalarioScenario: SalarioScenario;
}

const PYG = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

function pct(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

interface ScenarioRowProps {
  label: string;
  growthRate: number;
  projectedSalario: number;
  monthlyPayout: number;
  highlight?: boolean;
}

function ScenarioRow({ label, growthRate, projectedSalario, monthlyPayout, highlight }: ScenarioRowProps) {
  const multiple = monthlyPayout / projectedSalario;
  return (
    <div className={`grid grid-cols-4 gap-3 rounded-lg border px-4 py-3 text-sm ${highlight ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white"}`}>
      <div>
        <p className={`font-medium ${highlight ? "text-blue-700" : "text-gray-700"}`}>{label}</p>
        <p className="text-xs text-gray-400">{pct(growthRate)} anual</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Salario mínimo proyectado</p>
        <p className="font-semibold">{PYG.format(projectedSalario)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Tu renta mensual</p>
        <p className="font-semibold">{PYG.format(monthlyPayout)}</p>
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

export default function FutureSalarioSection({ scenarios, targetYear, monthlyPensionPayout, selectedSalarioScenario }: Props) {
  const { slow, moderate, fast } = scenarios;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Poder adquisitivo al retiro</h2>
        <p className="text-sm text-gray-500 mt-1">
          Basado en el historial del salario mínimo entre {moderate.fromYear} y {moderate.toYear}{" "}
          ({moderate.dataPointCount} datos, fuente: MTESS / impuestospy.com), el crecimiento anual promedio fue del{" "}
          <strong>{pct(moderate.annualGrowthRate)}</strong>. Aplicando ese ritmo y variantes, estimamos que en {targetYear}{" "}
          el salario mínimo rondará:
        </p>
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
          highlight={selectedSalarioScenario === "slow"}
        />
        <ScenarioRow
          label={moderate.label}
          growthRate={moderate.annualGrowthRate}
          projectedSalario={moderate.projectedValue}
          monthlyPayout={monthlyPensionPayout}
          highlight={selectedSalarioScenario === "moderate"}
        />
        <ScenarioRow
          label={fast.label}
          growthRate={fast.annualGrowthRate}
          projectedSalario={fast.projectedValue}
          monthlyPayout={monthlyPensionPayout}
          highlight={selectedSalarioScenario === "fast"}
        />
      </div>

      <p className="text-xs text-gray-400">
        A mayor crecimiento del salario mínimo, menor es el poder adquisitivo relativo de tu jubilación.
        El escenario "Alto" es el desfavorable para el jubilado.
      </p>
    </div>
  );
}
