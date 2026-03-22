export interface AccumulatedFundParams {
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
  years: number;
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
}

export interface ProjectPensionResult {
  accumulatedFund: number;
  monthlyPayout: number;
  yearsContributing: number;
  yearsInRetirement: number;
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
}: AccumulatedFundParams): number {
  if (years === 0) return 0;

  const netAnnualRate = annualReturnRate - annualFeeRate;
  const n = years * 12;

  if (netAnnualRate === 0) {
    return monthlyContribution * n;
  }

  const r = netAnnualRate / 12;
  return monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
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
}: Omit<ProjectPensionParams, "lifeExpectancy">): FundGrowthPoint[] {
  const points: FundGrowthPoint[] = [];
  for (let age = currentAge; age <= retirementAge; age++) {
    const years = age - currentAge;
    const fund = calculateAccumulatedFund({
      monthlyContribution,
      annualReturnRate,
      annualFeeRate,
      years,
    });
    points.push({ age, fund });
  }
  return points;
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
  };
}
