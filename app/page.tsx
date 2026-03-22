"use client";

import { useState, useMemo } from "react";
import CalculatorForm, { DEFAULTS, type CalculatorInputs } from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import FundGrowthChart from "@/components/FundGrowthChart";
import FutureSalarioSection from "@/components/FutureSalarioSection";
import { projectScenarios, buildScenariosGrowthSeries } from "@/lib/pension";
import { projectSalarioMinimoScenarios } from "@/lib/salarioMinimo";
import salarioData from "@/data/salario-minimo.json";

const SCENARIO_SPREAD = 0.03;
const CURRENT_YEAR = 2025;

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULTS);

  const isValid =
    inputs.retirementAge > inputs.currentAge &&
    inputs.lifeExpectancy > inputs.retirementAge;

  const retirementYear = CURRENT_YEAR + (inputs.retirementAge - inputs.currentAge);

  const scenarios = useMemo(() => {
    if (!isValid) return null;
    try {
      return projectScenarios(
        {
          monthlyContribution: inputs.monthlyContribution,
          annualReturnRate: inputs.annualReturnRate / 100,
          annualFeeRate: inputs.annualFeeRate / 100,
          currentAge: inputs.currentAge,
          retirementAge: inputs.retirementAge,
          lifeExpectancy: inputs.lifeExpectancy,
          existingFund: inputs.existingFund,
        },
        SCENARIO_SPREAD
      );
    } catch {
      return null;
    }
  }, [inputs, isValid]);

  const growthData = useMemo(() => {
    if (!isValid) return [];
    return buildScenariosGrowthSeries(
      {
        monthlyContribution: inputs.monthlyContribution,
        annualReturnRate: inputs.annualReturnRate / 100,
        annualFeeRate: inputs.annualFeeRate / 100,
        currentAge: inputs.currentAge,
        retirementAge: inputs.retirementAge,
        existingFund: inputs.existingFund,
      },
      SCENARIO_SPREAD
    );
  }, [inputs, isValid]);

  const salarioScenarios = useMemo(() => {
    if (!isValid) return null;
    return projectSalarioMinimoScenarios(salarioData.data, retirementYear);
  }, [isValid, retirementYear]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Calculadora de Jubilación Privada</h1>
        <p className="text-gray-500 mt-1">Paraguay. Proyección basada en capitalización individual.</p>
      </div>

      <div className="flex flex-col gap-6">
        <CalculatorForm values={inputs} onChange={setInputs} />

        {!isValid && (
          <p className="text-sm text-red-600">
            Verificá las edades: la edad de jubilación debe ser mayor a la actual, y la expectativa de vida mayor a la jubilación.
          </p>
        )}

        {scenarios && (
          <ResultsDisplay
            scenarios={scenarios}
            currentSalaryMinimo={inputs.currentSalary}
            spread={SCENARIO_SPREAD}
            currentAge={inputs.currentAge}
            retirementAge={inputs.retirementAge}
          />
        )}

        {scenarios && salarioScenarios && (
          <FutureSalarioSection
            scenarios={salarioScenarios}
            targetYear={retirementYear}
            monthlyPensionPayout={scenarios.base.monthlyPayout}
          />
        )}

        {growthData.length > 0 && (
          <FundGrowthChart data={growthData} retirementAge={inputs.retirementAge} />
        )}
      </div>
    </main>
  );
}
