"use client";

import { calculateRequiredContribution } from "@/lib/pension";
import type { SalarioMinimoScenarios } from "@/lib/salarioMinimo";
import type { SalarioScenario } from "@/components/ScenarioSelector";

interface Props {
  annualReturnRate: number;       // gross rate for selected fund scenario, as decimal
  annualFeeRate: number;
  yearsContributing: number;
  yearsInRetirement: number;
  existingFund: number;
  currentMonthlyContribution: number;
  salarioScenarios: SalarioMinimoScenarios;
  selectedSalarioScenario: SalarioScenario;
}

const PYG = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

interface RowProps {
  label: string;
  targetSalario: number;
  requiredContribution: number;
  currentContribution: number;
  highlight?: boolean;
}

function Row({ label, targetSalario, requiredContribution, currentContribution, highlight }: RowProps) {
  const gap = requiredContribution - currentContribution;
  const covered = requiredContribution === 0 || currentContribution >= requiredContribution;

  return (
    <div className={`grid grid-cols-4 gap-3 rounded-lg border px-4 py-3 text-sm items-center ${highlight ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white"}`}>
      <div>
        <p className={`font-medium ${highlight ? "text-blue-700" : "text-gray-700"}`}>{label}</p>
        <p className="text-xs text-gray-400">Sal. mín. proyectado: {PYG.format(targetSalario)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Tu aporte actual</p>
        <p className="font-semibold">{PYG.format(currentContribution)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Aporte necesario para 1x</p>
        <p className="font-semibold">{covered ? "Ya cubierto" : PYG.format(requiredContribution)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Diferencia</p>
        {covered ? (
          <p className="font-semibold text-green-600">✓</p>
        ) : (
          <p className="font-semibold text-red-500">+{PYG.format(gap)}/mes</p>
        )}
      </div>
    </div>
  );
}

export default function RequiredContributionSection({
  annualReturnRate,
  annualFeeRate,
  yearsContributing,
  yearsInRetirement,
  existingFund,
  currentMonthlyContribution,
  salarioScenarios,
  selectedSalarioScenario,
}: Props) {
  const { slow, moderate, fast } = salarioScenarios;

  const commonParams = {
    annualReturnRate,
    annualFeeRate,
    yearsContributing,
    yearsInRetirement,
    existingFund,
  };

  const requiredSlow = calculateRequiredContribution({ ...commonParams, targetMonthlyPayout: slow.projectedValue });
  const requiredModerate = calculateRequiredContribution({ ...commonParams, targetMonthlyPayout: moderate.projectedValue });
  const requiredFast = calculateRequiredContribution({ ...commonParams, targetMonthlyPayout: fast.projectedValue });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">¿Cuánto necesitás ahorrar para 1 salario mínimo?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Aporte mensual necesario para recibir exactamente 1x el salario mínimo proyectado al retiro,
          usando {(annualReturnRate * 100).toFixed(1)}% bruto · {(annualFeeRate * 100).toFixed(1)}% comisión → {((annualReturnRate - annualFeeRate) * 100).toFixed(1)}% neto anual.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wide">
          <span>Escenario salario mínimo</span>
          <span>Tu aporte actual</span>
          <span>Aporte necesario para 1x</span>
          <span>Diferencia</span>
        </div>
        <Row
          label={slow.label}
          targetSalario={slow.projectedValue}
          requiredContribution={requiredSlow}
          currentContribution={currentMonthlyContribution}
          highlight={selectedSalarioScenario === "slow"}
        />
        <Row
          label={moderate.label}
          targetSalario={moderate.projectedValue}
          requiredContribution={requiredModerate}
          currentContribution={currentMonthlyContribution}
          highlight={selectedSalarioScenario === "moderate"}
        />
        <Row
          label={fast.label}
          targetSalario={fast.projectedValue}
          requiredContribution={requiredFast}
          currentContribution={currentMonthlyContribution}
          highlight={selectedSalarioScenario === "fast"}
        />
      </div>

      <p className="text-xs text-gray-400">
        El aporte necesario asume que seguís contribuyendo durante los {yearsContributing} años restantes
        hasta tu jubilación, con el saldo actual de la caja como punto de partida.
        Valores nominales, sin ajuste por inflación.
      </p>
    </div>
  );
}
