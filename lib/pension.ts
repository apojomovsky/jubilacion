export interface AccumulatedFundParams {
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
  years: number;
  existingFund?: number;
}

export interface MonthlyPayoutParams {
  fund: number;
  retirementYears: number;
}

export interface ProjectPensionParams {
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  existingFund?: number;
}

export interface ProjectPensionResult {
  accumulatedFund: number;
  monthlyPayout: number;
  yearsContributing: number;
  yearsInRetirement: number;
  annualReturnRate: number;
}

/**
 * Future value of a monthly annuity with compound returns, net of fees.
 * FV = PMT * [((1 + r)^n - 1) / r]
 * where r = (annualReturn - annualFee) / 12 and n = years * 12
 */
export function calculateAccumulatedFund({
  monthlyContribution,
  annualReturnRate,
  annualFeeRate,
  years,
  existingFund = 0,
}: AccumulatedFundParams): number {
  if (years === 0) return existingFund;

  const netAnnualRate = annualReturnRate - annualFeeRate;
  const n = years * 12;
  const r = netAnnualRate / 12;

  const contributionsFV =
    netAnnualRate === 0
      ? monthlyContribution * n
      : monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);

  const existingFV =
    netAnnualRate === 0
      ? existingFund
      : existingFund * Math.pow(1 + r, n);

  return contributionsFV + existingFV;
}

/**
 * Simple monthly payout: divide the fund evenly across retirement months.
 */
export function calculateMonthlyPayout({
  fund,
  retirementYears,
}: MonthlyPayoutParams): number {
  if (fund === 0) return 0;
  return fund / (retirementYears * 12);
}

export interface FundGrowthPoint {
  age: number;
  fund: number;
}

/**
 * Returns yearly accumulated fund snapshots from currentAge to retirementAge.
 */
export function buildFundGrowthSeries({
  monthlyContribution,
  annualReturnRate,
  annualFeeRate,
  currentAge,
  retirementAge,
  existingFund = 0,
}: Omit<ProjectPensionParams, "lifeExpectancy">): FundGrowthPoint[] {
  const points: FundGrowthPoint[] = [];
  for (let age = currentAge; age <= retirementAge; age++) {
    const years = age - currentAge;
    const fund = calculateAccumulatedFund({
      monthlyContribution,
      annualReturnRate,
      annualFeeRate,
      years,
      existingFund,
    });
    points.push({ age, fund });
  }
  return points;
}

export interface ScenarioGrowthPoint {
  age: number;
  pessimistic: number;
  base: number;
  optimistic: number;
}

export function buildScenariosGrowthSeries(
  params: Omit<ProjectPensionParams, "lifeExpectancy">,
  spread = 0.03
): ScenarioGrowthPoint[] {
  const pessimisticRate = Math.max(0, params.annualReturnRate - spread);
  const optimisticRate = params.annualReturnRate + spread;

  const points: ScenarioGrowthPoint[] = [];
  for (let age = params.currentAge; age <= params.retirementAge; age++) {
    const years = age - params.currentAge;
    const common = { monthlyContribution: params.monthlyContribution, annualFeeRate: params.annualFeeRate, years, existingFund: params.existingFund };
    points.push({
      age,
      pessimistic: calculateAccumulatedFund({ ...common, annualReturnRate: pessimisticRate }),
      base: calculateAccumulatedFund({ ...common, annualReturnRate: params.annualReturnRate }),
      optimistic: calculateAccumulatedFund({ ...common, annualReturnRate: optimisticRate }),
    });
  }
  return points;
}

export interface Scenarios {
  pessimistic: ProjectPensionResult;
  base: ProjectPensionResult;
  optimistic: ProjectPensionResult;
}

/**
 * Runs three projections: base, pessimistic (base - spread), optimistic (base + spread).
 * Default spread is 3 percentage points on the annual return rate.
 * Pessimistic return is clamped to 0 to avoid negative projections.
 */
export function projectScenarios(
  params: ProjectPensionParams,
  spread = 0.03
): Scenarios {
  return {
    pessimistic: projectPension({
      ...params,
      annualReturnRate: Math.max(0, params.annualReturnRate - spread),
    }),
    base: projectPension(params),
    optimistic: projectPension({
      ...params,
      annualReturnRate: params.annualReturnRate + spread,
    }),
  };
}

/**
 * Full pension projection given contribution and age inputs.
 */
export function projectPension({
  monthlyContribution,
  annualReturnRate,
  annualFeeRate,
  currentAge,
  retirementAge,
  lifeExpectancy,
  existingFund = 0,
}: ProjectPensionParams): ProjectPensionResult {
  if (retirementAge <= currentAge) {
    throw new Error("retirementAge must be greater than currentAge");
  }
  if (lifeExpectancy <= retirementAge) {
    throw new Error("lifeExpectancy must be greater than retirementAge");
  }

  const yearsContributing = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  const accumulatedFund = calculateAccumulatedFund({
    monthlyContribution,
    annualReturnRate,
    annualFeeRate,
    years: yearsContributing,
    existingFund,
  });

  const monthlyPayout = calculateMonthlyPayout({
    fund: accumulatedFund,
    retirementYears: yearsInRetirement,
  });

  return {
    accumulatedFund,
    monthlyPayout,
    yearsContributing,
    yearsInRetirement,
    annualReturnRate,
  };
}
