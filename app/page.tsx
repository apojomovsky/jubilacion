"use client";

import { useState, useMemo } from "react";
import CalculatorForm, { DEFAULTS, type CalculatorInputs } from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import FundGrowthChart from "@/components/FundGrowthChart";
import FutureSalarioSection from "@/components/FutureSalarioSection";
import MathSection from "@/components/MathSection";
import RequiredContributionSection from "@/components/RequiredContributionSection";
import type { FundScenario, SalarioScenario } from "@/components/ScenarioSelector";
import GrowingContributionSection from "@/components/GrowingContributionSection";
import SourcesSection from "@/components/SourcesSection";
import { projectScenarios, buildScenariosGrowthSeries } from "@/lib/pension";
import { projectSalarioMinimoScenarios } from "@/lib/salarioMinimo";
import salarioData from "@/data/salario-minimo.json";

const SCENARIO_SPREAD = 0.03;
const CURRENT_YEAR = 2025;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      {children}
    </div>
  );
}

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULTS);
  const [fundScenario, setFundScenario] = useState<FundScenario>("base");
  const [salarioScenario, setSalarioScenario] = useState<SalarioScenario>("moderate");

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

  // Effective gross return rate for the selected fund scenario
  const selectedFundReturnRate = useMemo(() => {
    const gross = inputs.annualReturnRate / 100;
    if (fundScenario === "pessimistic") return Math.max(0, gross - SCENARIO_SPREAD);
    if (fundScenario === "optimistic") return gross + SCENARIO_SPREAD;
    return gross;
  }, [inputs.annualReturnRate, fundScenario]);

  // Monthly payout for the selected fund scenario
  const selectedMonthlyPayout = scenarios
    ? scenarios[fundScenario].monthlyPayout
    : 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Calculadora de Jubilación Privada</h1>
        <p className="text-gray-500 mt-1">Paraguay. Proyección basada en capitalización individual.</p>
      </div>

      <div className="flex flex-col gap-5">
        <SectionCard>
          <CalculatorForm values={inputs} onChange={setInputs} />
        </SectionCard>

        {!isValid && (
          <p className="text-sm text-red-600">
            Verificá las edades: la edad de jubilación debe ser mayor a la actual, y la expectativa de vida mayor a la jubilación.
          </p>
        )}

        {scenarios && (
          <SectionCard>
            <ResultsDisplay
              scenarios={scenarios}
              currentSalaryMinimo={inputs.currentSalary}
              spread={SCENARIO_SPREAD}
              currentAge={inputs.currentAge}
              retirementAge={inputs.retirementAge}
              selectedScenario={fundScenario}
              onSelectScenario={setFundScenario}
            />
          </SectionCard>
        )}

        {growthData.length > 0 && (
          <SectionCard>
            <FundGrowthChart
              data={growthData}
              retirementAge={inputs.retirementAge}
              selectedScenario={fundScenario}
            />
          </SectionCard>
        )}

        {scenarios && salarioScenarios && (
          <SectionCard>
            <FutureSalarioSection
              scenarios={salarioScenarios}
              targetYear={retirementYear}
              monthlyPensionPayout={selectedMonthlyPayout}
              selectedSalarioScenario={salarioScenario}
              onSelectSalarioScenario={setSalarioScenario}
            />
          </SectionCard>
        )}

        {scenarios && salarioScenarios && (
          <SectionCard>
            <RequiredContributionSection
              annualReturnRate={selectedFundReturnRate}
              annualFeeRate={inputs.annualFeeRate / 100}
              yearsContributing={scenarios.base.yearsContributing}
              yearsInRetirement={scenarios.base.yearsInRetirement}
              existingFund={inputs.existingFund}
              currentMonthlyContribution={inputs.monthlyContribution}
              salarioScenarios={salarioScenarios}
              selectedSalarioScenario={salarioScenario}
            />
          </SectionCard>
        )}

        {scenarios && salarioScenarios && (
          <SectionCard>
            <GrowingContributionSection
              initialMonthlyContribution={inputs.monthlyContribution}
              annualReturnRate={selectedFundReturnRate}
              annualFeeRate={inputs.annualFeeRate / 100}
              yearsContributing={scenarios.base.yearsContributing}
              yearsInRetirement={scenarios.base.yearsInRetirement}
              existingFund={inputs.existingFund}
              salarioMinimoCagrRate={salarioScenarios.moderate.annualGrowthRate}
            />
          </SectionCard>
        )}

        {salarioScenarios && (
          <MathSection
            historicalData={salarioData.data}
            scenarios={salarioScenarios}
            targetYear={retirementYear}
          />
        )}

        <SectionCard>
          <SourcesSection />
        </SectionCard>
      </div>
    </main>
  );
}
