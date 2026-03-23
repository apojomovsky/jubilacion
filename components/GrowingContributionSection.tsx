"use client";

import { calculateAccumulatedFundWithGrowingContributions, calculateMonthlyPayout } from "@/lib/pension";

interface Props {
  initialMonthlyContribution: number;
  annualReturnRate: number; // effective gross rate for selected fund scenario
  annualFeeRate: number;
  yearsContributing: number;
  yearsInRetirement: number;
  existingFund: number;
  salarioMinimoCagrRate: number; // moderate scenario CAGR for labeling
  selectedGrowthRate: number; // currently active growth rate from the form
}

import { formatPYG } from "@/lib/format";

function pct(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

interface RowProps {
  label: string;
  sublabel: string;
  growthRate: number;
  fund: number;
  monthlyPayout: number;
  multiplier: number;
  highlight?: boolean;
}

function Row({ label, sublabel, growthRate, fund, monthlyPayout, multiplier, highlight }: RowProps) {
  return (
    <div className={`grid grid-cols-5 gap-3 rounded-lg border px-4 py-3 text-sm min-w-[700px] ${
      highlight ? "border-blue-700 bg-blue-950" : "border-gray-800 bg-gray-800"
    }`}>
      <div>
        <p className={`font-medium ${highlight ? "text-blue-400" : "text-gray-300"}`}>{label}</p>
        <p className="text-xs text-gray-500">{sublabel}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Crecimiento</p>
        <p className="font-semibold">{pct(growthRate)}/año</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Fondo al retiro</p>
        <p className="font-semibold">{formatPYG(fund)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Renta mensual</p>
        <p className="font-semibold">{formatPYG(monthlyPayout)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">vs. aporte fijo</p>
        <p className={`text-lg font-bold ${multiplier > 1 ? "text-green-600" : "text-gray-500"}`}>
          {multiplier.toFixed(2)}x
        </p>
      </div>
    </div>
  );
}

export default function GrowingContributionSection({
  initialMonthlyContribution,
  annualReturnRate,
  annualFeeRate,
  yearsContributing,
  yearsInRetirement,
  existingFund,
  salarioMinimoCagrRate,
  selectedGrowthRate,
}: Props) {
  const commonParams = {
    initialMonthlyContribution,
    annualReturnRate,
    annualFeeRate,
    years: yearsContributing,
    existingFund,
  };

  const presets = [
    { rate: 0,                    label: "Nunca lo toco",                            sublabel: "siempre el mismo monto nominal" },
    { rate: 0.03,                  label: "Lo ajusto anualmente al IPC (inflacion)", sublabel: "~3%/año estimado, mantiene su valor real" },
    { rate: salarioMinimoCagrRate, label: "Lo ajusto al ritmo del salario minimo",   sublabel: `${pct(salarioMinimoCagrRate)}/año (CAGR 2010-hoy)` },
  ];

  const isCustom = !presets.some((p) => Math.abs(p.rate - selectedGrowthRate) < 1e-5) && selectedGrowthRate > 0;
  const rates = isCustom
    ? [...presets, { rate: selectedGrowthRate, label: "Personalizado", sublabel: `${pct(selectedGrowthRate)}/año` }]
    : presets;

  const results = rates.map(({ rate, label, sublabel }) => {
    const fund = calculateAccumulatedFundWithGrowingContributions({
      ...commonParams,
      annualContributionGrowthRate: rate,
    });
    const payout = calculateMonthlyPayout({ fund, retirementYears: yearsInRetirement });
    return { rate, label, sublabel, fund, payout };
  });

  const baseFund = results[0].fund;

  const finalContributions = rates.map(({ rate }) =>
    initialMonthlyContribution * Math.pow(1 + rate, yearsContributing)
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">Impacto del ajuste anual del aporte</h2>
        <p className="text-sm text-gray-400 mt-1">
          Segun la opcion que elegiste arriba, la tabla muestra como cambia el fondo final y la renta mensual.
          La columna "vs. fijo" compara cada opcion contra no ajustar nunca el aporte.
        </p>
      </div>

      <div className="overflow-x-auto">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-3 px-4 text-xs text-gray-600 font-medium uppercase tracking-wide min-w-[700px]">
          <span>Opcion de ajuste</span>
          <span>Aumento anual</span>
          <span>Fondo al retiro</span>
          <span>Renta mensual</span>
          <span>vs. fijo</span>
        </div>
        {results.map((r, i) => (
          <Row
            key={r.rate}
            label={r.label}
            sublabel={`Aporte final: ${formatPYG(Math.round(finalContributions[i]))}/mes`}
            growthRate={r.rate}
            fund={r.fund}
            monthlyPayout={r.payout}
            multiplier={r.fund / baseFund}
            highlight={Math.abs(r.rate - selectedGrowthRate) < 1e-5}
          />
        ))}
      </div>
      </div>

      <p className="text-xs text-gray-600">
        "Aporte final" es el monto mensual que estarías aportando en el último año antes del retiro,
        si aplicás ese ritmo de ajuste consistentemente. Valores nominales.
      </p>
    </div>
  );
}
