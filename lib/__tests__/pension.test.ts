import {
  calculateAccumulatedFund,
  calculateMonthlyPayout,
  projectPension,
  projectScenarios,
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
  it("divides fund by expected months in retirement", () => {
    const fund = 120_000_000;
    const result = calculateMonthlyPayout({ fund, retirementYears: 20 });
    expect(result).toBeCloseTo(120_000_000 / (20 * 12), 0);
  });

  it("returns 0 for a zero fund", () => {
    const result = calculateMonthlyPayout({ fund: 0, retirementYears: 20 });
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
