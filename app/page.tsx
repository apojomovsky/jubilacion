"use client";

import { useState, useMemo } from "react";
import CalculatorForm, { DEFAULTS, type CalculatorInputs } from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import FundGrowthChart from "@/components/FundGrowthChart";
import RetirementDrawdownChart from "@/components/RetirementDrawdownChart";
import FutureSalarioSection from "@/components/FutureSalarioSection";
import MathSection from "@/components/MathSection";
import RequiredContributionSection from "@/components/RequiredContributionSection";
import type { FundScenario, SalarioScenario } from "@/components/ScenarioSelector";
import GrowingContributionSection from "@/components/GrowingContributionSection";
import ConclusionBanner from "@/components/ConclusionBanner";
import SourcesSection from "@/components/SourcesSection";
import {
  projectScenarios,
  buildScenariosGrowthSeries,
  buildScenariosDrawdownSeries,
} from "@/lib/pension";
import { projectSalarioMinimoScenarios } from "@/lib/salarioMinimo";
import salarioData from "@/data/salario-minimo.json";

const CURRENT_YEAR = 2025;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 shadow-none p-5">{children}</div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULTS);
  const [fundScenario, setFundScenario] = useState<FundScenario>("base");
  const [salarioScenario, setSalarioScenario] = useState<SalarioScenario>("moderate");
  const [contributionGrowthRate, setContributionGrowthRate] = useState(0);
  const [targetMultiplier, setTargetMultiplier] = useState(1);

  const isValid =
    inputs.retirementAge > inputs.currentAge && inputs.lifeExpectancy > inputs.retirementAge;

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
          annualContributionGrowthRate: contributionGrowthRate,
        },
        inputs.scenarioSpread / 100
      );
    } catch {
      return null;
    }
  }, [inputs, isValid, contributionGrowthRate]);

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
        annualContributionGrowthRate: contributionGrowthRate,
      },
      inputs.scenarioSpread / 100
    );
  }, [inputs, isValid, contributionGrowthRate]);

  const drawdownData = useMemo(() => {
    if (!scenarios) return [];
    return buildScenariosDrawdownSeries(
      scenarios,
      inputs.retirementAge,
      inputs.lifeExpectancy,
      inputs.annualFeeRate / 100
    );
  }, [scenarios, inputs.retirementAge, inputs.lifeExpectancy, inputs.annualFeeRate]);

  const salarioScenarios = useMemo(() => {
    if (!isValid) return null;
    return projectSalarioMinimoScenarios(salarioData.data, retirementYear);
  }, [isValid, retirementYear]);

  const salarioCagrRate = useMemo(
    () => projectSalarioMinimoScenarios(salarioData.data, retirementYear).moderate.annualGrowthRate,
    [retirementYear]
  );

  const selectedFundReturnRate = useMemo(() => {
    const gross = inputs.annualReturnRate / 100;
    if (fundScenario === "pessimistic") return Math.max(0, gross - inputs.scenarioSpread / 100);
    if (fundScenario === "optimistic") return gross + inputs.scenarioSpread / 100;
    return gross;
  }, [inputs.annualReturnRate, inputs.scenarioSpread, fundScenario]);

  const selectedMonthlyPayout = scenarios ? scenarios[fundScenario].monthlyPayout : 0;

  // Banner calculations: always use base scenario + moderate salary growth.
  // When existingFund > 0, payout = contributionPayout + existingFundPayout.
  // We scale only the contribution component to find the needed contribution.
  const bannerData = useMemo(() => {
    if (!scenarios || !salarioScenarios) return null;
    const payout = scenarios.base.monthlyPayout;
    const projectedSalario = salarioScenarios.moderate.projectedValue;
    const actualMultiple = payout / projectedSalario;
    const targetPayout = targetMultiplier * projectedSalario;

    const netMonthlyRate = (inputs.annualReturnRate / 100 - inputs.annualFeeRate / 100) / 12;
    const n = scenarios.base.yearsContributing * 12;
    const existingFundFV = inputs.existingFund * Math.pow(1 + netMonthlyRate, n);
    const existingFundPayout = existingFundFV / (scenarios.base.yearsInRetirement * 12);
    const contributionPayout = payout - existingFundPayout;

    const neededContribution =
      contributionPayout > 0
        ? (inputs.monthlyContribution * (targetPayout - existingFundPayout)) / contributionPayout
        : 0;
    const gap = Math.max(0, neededContribution - inputs.monthlyContribution);
    return { actualMultiple, payout, gap };
  }, [scenarios, salarioScenarios, targetMultiplier, inputs]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Previsor" className="w-14 h-14 rounded-xl" />
          <div>
            <h1 className="text-2xl font-bold">Previsor</h1>
            <p className="text-gray-500 mt-0.5">Calculadora de jubilación privada · Paraguay</p>
          </div>
        </div>
        <button
          onClick={() => setMode(mode === "simple" ? "advanced" : "simple")}
          className="text-sm text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          {mode === "simple" ? "Modo avanzado" : "Modo simple"}
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <SectionCard>
          <CalculatorForm
            values={inputs}
            onChange={setInputs}
            growthRate={contributionGrowthRate}
            onGrowthRateChange={setContributionGrowthRate}
            salarioCagrRate={salarioCagrRate}
            mode={mode}
            targetMultiplier={targetMultiplier}
            onTargetMultiplierChange={setTargetMultiplier}
          />
        </SectionCard>

        {!isValid && (
          <p className="text-sm text-red-600">
            Verificá las edades: la edad de jubilación debe ser mayor a la actual, y la expectativa
            de vida mayor a la jubilación.
          </p>
        )}

        {bannerData && (
          <ConclusionBanner
            actualMultiple={bannerData.actualMultiple}
            targetMultiple={targetMultiplier}
            monthlyPayout={bannerData.payout}
            contributionGap={bannerData.gap}
            targetYear={retirementYear}
          />
        )}

        {scenarios && (
          <SectionCard>
            <ResultsDisplay
              scenarios={scenarios}
              currentSalaryMinimo={inputs.currentSalary}
              spread={inputs.scenarioSpread / 100}
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

        {drawdownData.length > 0 && (
          <SectionCard>
            <RetirementDrawdownChart
              data={drawdownData}
              retirementAge={inputs.retirementAge}
              selectedScenario={fundScenario}
            />
          </SectionCard>
        )}

        {mode === "advanced" && scenarios && salarioScenarios && (
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

        {mode === "advanced" && scenarios && salarioScenarios && (
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

        {mode === "advanced" && scenarios && salarioScenarios && (
          <SectionCard>
            <GrowingContributionSection
              initialMonthlyContribution={inputs.monthlyContribution}
              annualReturnRate={selectedFundReturnRate}
              annualFeeRate={inputs.annualFeeRate / 100}
              yearsContributing={scenarios.base.yearsContributing}
              yearsInRetirement={scenarios.base.yearsInRetirement}
              existingFund={inputs.existingFund}
              salarioMinimoCagrRate={salarioScenarios.moderate.annualGrowthRate}
              selectedGrowthRate={contributionGrowthRate}
            />
          </SectionCard>
        )}

        {mode === "advanced" && salarioScenarios && (
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
