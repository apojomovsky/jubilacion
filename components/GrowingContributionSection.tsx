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
}: Props) {
  const commonParams = {
    initialMonthlyContribution,
    annualReturnRate,
    annualFeeRate,
    years: yearsContributing,
    existingFund,
  };

  const rates = [
    { rate: 0,                    label: "Nunca lo ajusto",               sublabel: "siempre el mismo monto" },
    { rate: 0.03,                  label: "Lo subo con la inflacion",      sublabel: "~3%/año, mantengo poder adquisitivo" },
    { rate: 0.045,                 label: "Lo subo un poco mas",           sublabel: "~4.5%/año, crezco en terminos reales" },
    { rate: salarioMinimoCagrRate, label: "Lo subo como el salario minimo", sublabel: `${pct(salarioMinimoCagrRate)}/año (CAGR 2010-hoy)` },
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
        <h2 className="text-lg font-semibold text-gray-100">¿Qué pasa si aumentás tu aporte cada año?</h2>
        <p className="text-sm text-gray-400 mt-1">
          Hoy aportás {formatPYG(initialMonthlyContribution)}/mes. La pregunta es: cada año, ese monto, lo dejás igual o lo aumentas?
          Si lo aumentas aunque sea un poco, el efecto sobre el fondo final es enorme.
          La tabla muestra cuanto terminas aportando y que fondo acumulas segun el ritmo de aumento que elijas.
        </p>
      </div>

      <div className="overflow-x-auto">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-3 px-4 text-xs text-gray-600 font-medium uppercase tracking-wide min-w-[700px]">
          <span>Que hago con mi aporte cada año</span>
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
      </div>

      <p className="text-xs text-gray-600">
        "Aporte final" es el monto mensual que estarías aportando en el último año antes del retiro,
        si aplicás ese ritmo de ajuste consistentemente. Valores nominales.
      </p>
    </div>
  );
}
