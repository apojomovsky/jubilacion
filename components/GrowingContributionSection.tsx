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
    <div className={`grid grid-cols-5 gap-3 rounded-lg border px-4 py-3 text-sm ${
      highlight ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-white"
    }`}>
      <div>
        <p className={`font-medium ${highlight ? "text-blue-700" : "text-gray-700"}`}>{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Crecimiento</p>
        <p className="font-semibold">{pct(growthRate)}/año</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Fondo al retiro</p>
        <p className="font-semibold">{formatPYG(fund)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Renta mensual</p>
        <p className="font-semibold">{formatPYG(monthlyPayout)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">vs. aporte fijo</p>
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
}: Props) {
  const commonParams = {
    initialMonthlyContribution,
    annualReturnRate,
    annualFeeRate,
    years: yearsContributing,
    existingFund,
  };

  const rates = [
    { rate: 0,                    label: "Aporte fijo",          sublabel: "sin ajuste" },
    { rate: 0.03,                  label: "Inflación estimada",   sublabel: "~3%/año" },
    { rate: 0.045,                 label: "Crecimiento moderado", sublabel: "~4.5%/año" },
    { rate: salarioMinimoCagrRate, label: "Salario mínimo",       sublabel: `${pct(salarioMinimoCagrRate)}/año (CAGR reciente)` },
  ];

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
        <h2 className="text-lg font-semibold">¿Qué pasa si aumentás tu aporte cada año?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tu aporte inicial es {formatPYG(initialMonthlyContribution)}/mes. Si lo ajustás anualmente
          (por ejemplo, al ritmo de la inflación o del salario mínimo), el fondo acumulado al retiro
          crece significativamente. La tabla compara distintos ritmos de ajuste.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wide">
          <span>Estrategia</span>
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
            highlight={i === rates.findIndex(({ rate }) => Math.abs(rate - salarioMinimoCagrRate) < 0.001)}
          />
        ))}
      </div>

      <p className="text-xs text-gray-400">
        "Aporte final" es el monto mensual que estarías aportando en el último año antes del retiro,
        si aplicás ese ritmo de ajuste consistentemente. Valores nominales.
      </p>
    </div>
  );
}
