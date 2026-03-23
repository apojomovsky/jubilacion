import {
  calculateAccumulatedFund,
  calculateAccumulatedFundWithGrowingContributions,
  calculateMonthlyPayout,
  projectPension,
  projectScenarios,
  calculateRequiredContribution,
} from "@/lib/pension";

describe("calculateAccumulatedFund", () => {
  it("accumulates contributions with compound returns over time", () => {
    // 1,000,000 PYG/month, 8% annual return, 0% fee, 10 years
    const result = calculateAccumulatedFund({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0,
      years: 10,
    });
    // Future value of annuity: PMT * [((1+r)^n - 1) / r]
    // monthly r = 0.08/12, n = 120 months
    const r = 0.08 / 12;
    const n = 120;
    const expected = 1_000_000 * ((Math.pow(1 + r, n) - 1) / r);
    expect(result).toBeCloseTo(expected, 0);
  });

  it("applies annual fee rate to reduce effective return", () => {
    const withFee = calculateAccumulatedFund({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0.02,
      years: 10,
    });
    const withoutFee = calculateAccumulatedFund({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0,
      years: 10,
    });
    expect(withFee).toBeLessThan(withoutFee);
  });

  it("returns 0 for 0 years", () => {
    const result = calculateAccumulatedFund({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0.01,
      years: 0,
    });
    expect(result).toBe(0);
  });

  it("compounds an existing balance alongside new contributions", () => {
    const r = 0.08 / 12;
    const n = 120;
    const existingFund = 10_000_000;
    const result = calculateAccumulatedFund({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0,
      years: 10,
      existingFund,
    });
    const expectedContributions = 1_000_000 * ((Math.pow(1 + r, n) - 1) / r);
    const expectedExisting = existingFund * Math.pow(1 + r, n);
    expect(result).toBeCloseTo(expectedContributions + expectedExisting, 0);
  });

  it("existing fund alone grows correctly with no new contributions", () => {
    const r = 0.06 / 12;
    const n = 60;
    const existingFund = 5_000_000;
    const result = calculateAccumulatedFund({
      monthlyContribution: 0,
      annualReturnRate: 0.06,
      annualFeeRate: 0,
      years: 5,
      existingFund,
    });
    expect(result).toBeCloseTo(existingFund * Math.pow(1 + r, n), 0);
  });

  it("returns principal only when return and fee are both 0", () => {
    const result = calculateAccumulatedFund({
      monthlyContribution: 500_000,
      annualReturnRate: 0,
      annualFeeRate: 0,
      years: 5,
    });
    expect(result).toBeCloseTo(500_000 * 12 * 5, 0);
  });
});

describe("calculateMonthlyPayout", () => {
  it("uses annuity formula when rate > 0", () => {
    const fund = 120_000_000;
    const r = 0.07 / 12;
    const n = 20 * 12;
    const expected = (fund * r) / (1 - Math.pow(1 + r, -n));
    const result = calculateMonthlyPayout({
      fund,
      retirementYears: 20,
      annualReturnRate: 0.07,
      annualFeeRate: 0,
    });
    expect(result).toBeCloseTo(expected, 0);
  });

  it("falls back to simple division when net rate is 0", () => {
    const fund = 120_000_000;
    const result = calculateMonthlyPayout({
      fund,
      retirementYears: 20,
      annualReturnRate: 0,
      annualFeeRate: 0,
    });
    expect(result).toBeCloseTo(120_000_000 / (20 * 12), 0);
  });

  it("returns 0 for a zero fund", () => {
    const result = calculateMonthlyPayout({
      fund: 0,
      retirementYears: 20,
      annualReturnRate: 0.07,
      annualFeeRate: 0,
    });
    expect(result).toBe(0);
  });
});

describe("projectPension", () => {
  it("returns accumulated fund and monthly payout", () => {
    const result = projectPension({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0.01,
      currentAge: 30,
      retirementAge: 60,
      lifeExpectancy: 80,
    });
    expect(result.accumulatedFund).toBeGreaterThan(0);
    expect(result.monthlyPayout).toBeGreaterThan(0);
    expect(result.yearsContributing).toBe(30);
    expect(result.yearsInRetirement).toBe(20);
  });

  it("gives a higher fund when an existing balance is provided", () => {
    const base = projectPension({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0.01,
      currentAge: 30,
      retirementAge: 60,
      lifeExpectancy: 80,
    });
    const withExisting = projectPension({
      monthlyContribution: 1_000_000,
      annualReturnRate: 0.08,
      annualFeeRate: 0.01,
      currentAge: 30,
      retirementAge: 60,
      lifeExpectancy: 80,
      existingFund: 50_000_000,
    });
    expect(withExisting.accumulatedFund).toBeGreaterThan(base.accumulatedFund);
    expect(withExisting.monthlyPayout).toBeGreaterThan(base.monthlyPayout);
  });

  it("throws if retirementAge <= currentAge", () => {
    expect(() =>
      projectPension({
        monthlyContribution: 1_000_000,
        annualReturnRate: 0.08,
        annualFeeRate: 0.01,
        currentAge: 60,
        retirementAge: 55,
        lifeExpectancy: 80,
      })
    ).toThrow();
  });

  it("throws if lifeExpectancy <= retirementAge", () => {
    expect(() =>
      projectPension({
        monthlyContribution: 1_000_000,
        annualReturnRate: 0.08,
        annualFeeRate: 0.01,
        currentAge: 30,
        retirementAge: 60,
        lifeExpectancy: 55,
      })
    ).toThrow();
  });
});

describe("projectScenarios", () => {
  const base = {
    monthlyContribution: 1_000_000,
    annualReturnRate: 0.08,
    annualFeeRate: 0.01,
    currentAge: 30,
    retirementAge: 60,
    lifeExpectancy: 80,
  };

  it("returns three scenarios ordered pessimistic < base < optimistic", () => {
    const result = projectScenarios(base);
    expect(result.pessimistic.accumulatedFund).toBeLessThan(result.base.accumulatedFund);
    expect(result.base.accumulatedFund).toBeLessThan(result.optimistic.accumulatedFund);
    expect(result.pessimistic.monthlyPayout).toBeLessThan(result.base.monthlyPayout);
    expect(result.base.monthlyPayout).toBeLessThan(result.optimistic.monthlyPayout);
  });

  it("base scenario matches projectPension directly", () => {
    const scenarios = projectScenarios(base);
    const direct = projectPension(base);
    expect(scenarios.base.accumulatedFund).toBeCloseTo(direct.accumulatedFund, 0);
    expect(scenarios.base.monthlyPayout).toBeCloseTo(direct.monthlyPayout, 0);
  });

  it("respects a custom spread", () => {
    const narrow = projectScenarios(base, 0.01);
    const wide = projectScenarios(base, 0.05);
    const narrowSpread = narrow.optimistic.accumulatedFund - narrow.pessimistic.accumulatedFund;
    const wideSpread = wide.optimistic.accumulatedFund - wide.pessimistic.accumulatedFund;
    expect(wideSpread).toBeGreaterThan(narrowSpread);
  });

  it("clamps pessimistic return to 0 when spread exceeds return rate", () => {
    const lowReturn = { ...base, annualReturnRate: 0.02 };
    const result = projectScenarios(lowReturn, 0.05);
    expect(result.pessimistic.accumulatedFund).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateRequiredContribution", () => {
  const params = {
    targetMonthlyPayout: 3_000_000,
    annualReturnRate: 0.08,
    annualFeeRate: 0.01,
    yearsContributing: 30,
    yearsInRetirement: 20,
    existingFund: 0,
  };

  it("returns a contribution that, when used in projectPension, yields the target payout", () => {
    const required = calculateRequiredContribution(params);
    const fund = calculateAccumulatedFund({
      monthlyContribution: required,
      annualReturnRate: params.annualReturnRate,
      annualFeeRate: params.annualFeeRate,
      years: params.yearsContributing,
      existingFund: 0,
    });
    const payout = calculateMonthlyPayout({
      fund,
      retirementYears: params.yearsInRetirement,
      annualReturnRate: params.annualReturnRate,
      annualFeeRate: params.annualFeeRate,
    });
    expect(payout).toBeCloseTo(params.targetMonthlyPayout, 0);
  });

  it("returns a lower required contribution when an existing fund is provided", () => {
    const withoutExisting = calculateRequiredContribution(params);
    const withExisting = calculateRequiredContribution({ ...params, existingFund: 50_000_000 });
    expect(withExisting).toBeLessThan(withoutExisting);
  });

  it("returns 0 when existing fund already covers the target", () => {
    const required = calculateRequiredContribution({
      ...params,
      existingFund: 1_000_000_000, // huge existing fund
    });
    expect(required).toBe(0);
  });

  it("returns a higher required contribution for a larger target payout", () => {
    const low = calculateRequiredContribution({ ...params, targetMonthlyPayout: 1_000_000 });
    const high = calculateRequiredContribution({ ...params, targetMonthlyPayout: 5_000_000 });
    expect(high).toBeGreaterThan(low);
  });
});

describe("calculateAccumulatedFundWithGrowingContributions", () => {
  const base = {
    initialMonthlyContribution: 1_000_000,
    annualReturnRate: 0.08,
    annualFeeRate: 0.01,
    years: 20,
    existingFund: 0,
  };

  it("equals calculateAccumulatedFund when growth rate is 0", () => {
    const growing = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0,
    });
    const fixed = calculateAccumulatedFund({
      monthlyContribution: base.initialMonthlyContribution,
      annualReturnRate: base.annualReturnRate,
      annualFeeRate: base.annualFeeRate,
      years: base.years,
      existingFund: 0,
    });
    expect(growing).toBeCloseTo(fixed, -3); // within 1000 PYG
  });

  it("produces a larger fund when contributions grow", () => {
    const fixed = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0,
    });
    const growing = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0.05,
    });
    expect(growing).toBeGreaterThan(fixed);
  });

  it("higher growth rate produces a larger fund", () => {
    const low = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0.02,
    });
    const high = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0.06,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("existing fund compounds independently of contribution growth", () => {
    const withExisting = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0.04,
      existingFund: 50_000_000,
    });
    const withoutExisting = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0.04,
      existingFund: 0,
    });
    expect(withExisting).toBeGreaterThan(withoutExisting);
  });

  it("returns existingFund when years is 0", () => {
    const result = calculateAccumulatedFundWithGrowingContributions({
      ...base,
      annualContributionGrowthRate: 0.05,
      years: 0,
      existingFund: 10_000_000,
    });
    expect(result).toBe(10_000_000);
  });
});
