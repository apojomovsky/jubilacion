"use client";

import { useState, useMemo } from "react";
import CalculatorForm, { DEFAULTS, type CalculatorInputs } from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import FundGrowthChart from "@/components/FundGrowthChart";
import { projectPension, buildFundGrowthSeries } from "@/lib/pension";

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULTS);

  const isValid =
    inputs.retirementAge > inputs.currentAge &&
    inputs.lifeExpectancy > inputs.retirementAge;

  const result = useMemo(() => {
    if (!isValid) return null;
    try {
      return projectPension({
        monthlyContribution: inputs.monthlyContribution,
        annualReturnRate: inputs.annualReturnRate / 100,
        annualFeeRate: inputs.annualFeeRate / 100,
        currentAge: inputs.currentAge,
        retirementAge: inputs.retirementAge,
        lifeExpectancy: inputs.lifeExpectancy,
      });
    } catch {
      return null;
    }
  }, [inputs, isValid]);

  const growthData = useMemo(() => {
    if (!isValid) return [];
    return buildFundGrowthSeries({
      monthlyContribution: inputs.monthlyContribution,
      annualReturnRate: inputs.annualReturnRate / 100,
      annualFeeRate: inputs.annualFeeRate / 100,
      currentAge: inputs.currentAge,
      retirementAge: inputs.retirementAge,
    });
  }, [inputs, isValid]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Calculadora de Jubilacion Privada</h1>
        <p className="text-gray-500 mt-1">Paraguay. Proyeccion basada en capitalizacion individual.</p>
      </div>

      <div className="flex flex-col gap-6">
        <CalculatorForm values={inputs} onChange={setInputs} />

        {!isValid && (
          <p className="text-sm text-red-600">
            Verifica las edades: la edad de jubilacion debe ser mayor a la actual, y la expectativa de vida mayor a la jubilacion.
          </p>
        )}

        {result && (
          <ResultsDisplay result={result} currentSalaryMinimo={inputs.currentSalary} />
        )}

        {growthData.length > 0 && (
          <FundGrowthChart data={growthData} retirementAge={inputs.retirementAge} />
        )}

        <p className="text-xs text-gray-400">
          Proyeccion en valores nominales. No considera ajuste por inflacion aun. El modelo de inflacion real se agregara proximamente.
        </p>
      </div>
    </main>
  );
}
