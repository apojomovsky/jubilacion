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
  annualContributionGrowthRate?: number;
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
    const common = {
      initialMonthlyContribution: params.monthlyContribution,
      annualContributionGrowthRate: params.annualContributionGrowthRate ?? 0,
      annualFeeRate: params.annualFeeRate,
      years,
      existingFund: params.existingFund,
    };
    points.push({
      age,
      pessimistic: calculateAccumulatedFundWithGrowingContributions({ ...common, annualReturnRate: pessimisticRate }),
      base: calculateAccumulatedFundWithGrowingContributions({ ...common, annualReturnRate: params.annualReturnRate }),
      optimistic: calculateAccumulatedFundWithGrowingContributions({ ...common, annualReturnRate: optimisticRate }),
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

export interface RequiredContributionParams {
  targetMonthlyPayout: number;
  annualReturnRate: number;
  annualFeeRate: number;
  yearsContributing: number;
  yearsInRetirement: number;
  existingFund?: number;
}

/**
 * Solves for the monthly contribution required to reach a target monthly payout at retirement.
 *
 * Derivation:
 *   targetFund = targetMonthlyPayout * yearsInRetirement * 12
 *   existingFV = existingFund * (1 + r)^n          (existing balance compounds to retirement)
 *   neededFV   = targetFund - existingFV
 *   if neededFV <= 0: existing fund already covers target, return 0
 *   otherwise:
 *   contribution = neededFV * r / ((1 + r)^n - 1)  (inverse of annuity FV formula)
 *
 * where r = (annualReturnRate - annualFeeRate) / 12, n = yearsContributing * 12
 */
export function calculateRequiredContribution({
  targetMonthlyPayout,
  annualReturnRate,
  annualFeeRate,
  yearsContributing,
  yearsInRetirement,
  existingFund = 0,
}: RequiredContributionParams): number {
  const targetFund = targetMonthlyPayout * yearsInRetirement * 12;
  const netAnnualRate = annualReturnRate - annualFeeRate;
  const n = yearsContributing * 12;
  const r = netAnnualRate / 12;

  const existingFV = netAnnualRate === 0
    ? existingFund
    : existingFund * Math.pow(1 + r, n);

  const neededFV = targetFund - existingFV;
  if (neededFV <= 0) return 0;

  if (netAnnualRate === 0) return neededFV / n;

  return neededFV * r / (Math.pow(1 + r, n) - 1);
}

export interface GrowingContributionParams {
  initialMonthlyContribution: number;
  annualContributionGrowthRate: number; // e.g. 0.045 for 4.5%/yr
  annualReturnRate: number;
  annualFeeRate: number;
  years: number;
  existingFund?: number;
}

/**
 * Future value of a growing annuity: contributions increase at annualContributionGrowthRate per year.
 *
 * FV_contributions = PMT * [(1+r)^n - (1+g)^n] / (r - g)   when r ≠ g
 * FV_contributions = PMT * n * (1+r)^(n-1)                   when r ≈ g
 *
 * where r = monthly net return rate, g = monthly contribution growth rate,
 *       n = total months, PMT = initial monthly contribution.
 */
export function calculateAccumulatedFundWithGrowingContributions({
  initialMonthlyContribution,
  annualContributionGrowthRate,
  annualReturnRate,
  annualFeeRate,
  years,
  existingFund = 0,
}: GrowingContributionParams): number {
  if (years === 0) return existingFund;

  const netAnnualRate = annualReturnRate - annualFeeRate;
  const n = years * 12;
  const r = netAnnualRate / 12;
  const g = Math.pow(1 + annualContributionGrowthRate, 1 / 12) - 1;

  let contributionsFV: number;
  if (Math.abs(r - g) < 1e-10) {
    contributionsFV = initialMonthlyContribution * n * Math.pow(1 + r, n - 1);
  } else if (netAnnualRate === 0 && annualContributionGrowthRate === 0) {
    contributionsFV = initialMonthlyContribution * n;
  } else {
    contributionsFV =
      initialMonthlyContribution *
      (Math.pow(1 + r, n) - Math.pow(1 + g, n)) /
      (r - g);
  }

  const existingFV =
    netAnnualRate === 0
      ? existingFund
      : existingFund * Math.pow(1 + r, n);

  return contributionsFV + existingFV;
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
  annualContributionGrowthRate = 0,
}: ProjectPensionParams): ProjectPensionResult {
  if (retirementAge <= currentAge) {
    throw new Error("retirementAge must be greater than currentAge");
  }
  if (lifeExpectancy <= retirementAge) {
    throw new Error("lifeExpectancy must be greater than retirementAge");
  }

  const yearsContributing = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  const accumulatedFund = calculateAccumulatedFundWithGrowingContributions({
    initialMonthlyContribution: monthlyContribution,
    annualContributionGrowthRate: annualContributionGrowthRate ?? 0,
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
