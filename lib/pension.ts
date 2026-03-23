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
  annualReturnRate: number;
  annualFeeRate: number;
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

  const existingFV = netAnnualRate === 0 ? existingFund : existingFund * Math.pow(1 + r, n);

  return contributionsFV + existingFV;
}

/**
 * Monthly payout from a fund that continues earning returns during retirement.
 * Uses the annuity payment formula: PMT = PV * r / (1 - (1+r)^-n)
 * where r = net monthly rate, n = retirement months.
 * Falls back to simple division when net rate is zero.
 */
export function calculateMonthlyPayout({
  fund,
  retirementYears,
  annualReturnRate,
  annualFeeRate,
}: MonthlyPayoutParams): number {
  if (fund === 0) return 0;
  const n = retirementYears * 12;
  const netAnnualRate = annualReturnRate - annualFeeRate;
  if (netAnnualRate === 0) return fund / n;
  const r = netAnnualRate / 12;
  return (fund * r) / (1 - Math.pow(1 + r, -n));
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
      pessimistic: calculateAccumulatedFundWithGrowingContributions({
        ...common,
        annualReturnRate: pessimisticRate,
      }),
      base: calculateAccumulatedFundWithGrowingContributions({
        ...common,
        annualReturnRate: params.annualReturnRate,
      }),
      optimistic: calculateAccumulatedFundWithGrowingContributions({
        ...common,
        annualReturnRate: optimisticRate,
      }),
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
export function projectScenarios(params: ProjectPensionParams, spread = 0.03): Scenarios {
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
 *   targetFund = targetMonthlyPayout * (1 - (1+r)^-n_ret) / r   (PV of retirement annuity)
 *   existingFV = existingFund * (1 + r)^n_acc                   (existing balance compounds to retirement)
 *   neededFV   = targetFund - existingFV
 *   if neededFV <= 0: existing fund already covers target, return 0
 *   otherwise:
 *   contribution = neededFV * r / ((1 + r)^n_acc - 1)           (inverse of accumulation annuity FV formula)
 *
 * where r = (annualReturnRate - annualFeeRate) / 12,
 *       n_acc = yearsContributing * 12, n_ret = yearsInRetirement * 12
 */
export function calculateRequiredContribution({
  targetMonthlyPayout,
  annualReturnRate,
  annualFeeRate,
  yearsContributing,
  yearsInRetirement,
  existingFund = 0,
}: RequiredContributionParams): number {
  const netAnnualRate = annualReturnRate - annualFeeRate;
  const r = netAnnualRate / 12;
  const nRet = yearsInRetirement * 12;
  const targetFund =
    netAnnualRate === 0
      ? targetMonthlyPayout * nRet
      : (targetMonthlyPayout * (1 - Math.pow(1 + r, -nRet))) / r;

  const nAcc = yearsContributing * 12;

  const existingFV = netAnnualRate === 0 ? existingFund : existingFund * Math.pow(1 + r, nAcc);

  const neededFV = targetFund - existingFV;
  if (neededFV <= 0) return 0;

  if (netAnnualRate === 0) return neededFV / nAcc;

  return (neededFV * r) / (Math.pow(1 + r, nAcc) - 1);
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
      (initialMonthlyContribution * (Math.pow(1 + r, n) - Math.pow(1 + g, n))) / (r - g);
  }

  const existingFV = netAnnualRate === 0 ? existingFund : existingFund * Math.pow(1 + r, n);

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
    annualReturnRate,
    annualFeeRate,
  });

  return {
    accumulatedFund,
    monthlyPayout,
    yearsContributing,
    yearsInRetirement,
    annualReturnRate,
  };
}

export interface DrawdownPoint {
  age: number;
  pessimistic: number;
  base: number;
  optimistic: number;
}

/**
 * Builds yearly balance snapshots during the retirement drawdown phase.
 * Simulates month-by-month using the same net monthly rate as calculateMonthlyPayout,
 * sampling at year boundaries. Balance reaches exactly 0 at lifeExpectancy.
 */
export function buildScenariosDrawdownSeries(
  scenarios: Scenarios,
  retirementAge: number,
  lifeExpectancy: number,
  annualFeeRate: number
): DrawdownPoint[] {
  function drawdownSeries(fund: number, monthlyPayout: number, annualReturnRate: number): number[] {
    const r = (annualReturnRate - annualFeeRate) / 12;
    const points: number[] = [fund];
    let balance = fund;
    const totalMonths = (lifeExpectancy - retirementAge) * 12;
    for (let month = 1; month <= totalMonths; month++) {
      balance = balance * (1 + r) - monthlyPayout;
      if (month % 12 === 0) points.push(Math.max(0, balance));
    }
    return points;
  }

  const pess = drawdownSeries(
    scenarios.pessimistic.accumulatedFund,
    scenarios.pessimistic.monthlyPayout,
    scenarios.pessimistic.annualReturnRate
  );
  const base = drawdownSeries(
    scenarios.base.accumulatedFund,
    scenarios.base.monthlyPayout,
    scenarios.base.annualReturnRate
  );
  const opt = drawdownSeries(
    scenarios.optimistic.accumulatedFund,
    scenarios.optimistic.monthlyPayout,
    scenarios.optimistic.annualReturnRate
  );

  return pess.map((_, i) => ({
    age: retirementAge + i,
    pessimistic: pess[i],
    base: base[i],
    optimistic: opt[i],
  }));
}
