import {
  computeCAGR,
  projectSalarioMinimo,
  projectSalarioMinimoScenarios,
} from "@/lib/salarioMinimo";

const SAMPLE_DATA = [
  { year: 2000, monthly_pyg: 1_000_000 },
  { year: 2010, monthly_pyg: 2_000_000 },
  { year: 2020, monthly_pyg: 3_000_000 },
];

describe("computeCAGR", () => {
  it("computes the compound annual growth rate between two endpoints", () => {
    // 1_000_000 -> 2_000_000 over 10 years = 2^(1/10) - 1 ≈ 7.177%
    const rate = computeCAGR(SAMPLE_DATA, 2000, 2010);
    expect(rate).toBeCloseTo(Math.pow(2, 1 / 10) - 1, 4);
  });

  it("uses the first and last available years when no range given", () => {
    const rate = computeCAGR(SAMPLE_DATA);
    // 1_000_000 -> 3_000_000 over 20 years
    expect(rate).toBeCloseTo(Math.pow(3, 1 / 20) - 1, 4);
  });

  it("returns a positive rate for growing wages", () => {
    const rate = computeCAGR(SAMPLE_DATA);
    expect(rate).toBeGreaterThan(0);
  });

  it("throws when fewer than 2 data points match the range", () => {
    expect(() => computeCAGR(SAMPLE_DATA, 1800, 1900)).toThrow();
  });
});

describe("projectSalarioMinimo", () => {
  it("projects forward using compound growth", () => {
    const result = projectSalarioMinimo({
      currentValue: 1_000_000,
      currentYear: 2000,
      targetYear: 2010,
      annualGrowthRate: 0.07,
    });
    expect(result).toBeCloseTo(1_000_000 * Math.pow(1.07, 10), 0);
  });

  it("returns currentValue when targetYear equals currentYear", () => {
    const result = projectSalarioMinimo({
      currentValue: 2_000_000,
      currentYear: 2025,
      targetYear: 2025,
      annualGrowthRate: 0.05,
    });
    expect(result).toBe(2_000_000);
  });

  it("throws when targetYear is before currentYear", () => {
    expect(() =>
      projectSalarioMinimo({
        currentValue: 2_000_000,
        currentYear: 2025,
        targetYear: 2020,
        annualGrowthRate: 0.05,
      })
    ).toThrow();
  });
});

describe("projectSalarioMinimoScenarios", () => {
  it("returns three scenarios ordered slow < moderate < fast growth", () => {
    const result = projectSalarioMinimoScenarios(SAMPLE_DATA, 2030);
    expect(result.slow.annualGrowthRate).toBeLessThan(result.moderate.annualGrowthRate);
    expect(result.moderate.annualGrowthRate).toBeLessThan(result.fast.annualGrowthRate);
    expect(result.slow.projectedValue).toBeLessThan(result.moderate.projectedValue);
    expect(result.moderate.projectedValue).toBeLessThan(result.fast.projectedValue);
  });

  it("includes the growth rate and data range metadata in each scenario", () => {
    const result = projectSalarioMinimoScenarios(SAMPLE_DATA, 2030);
    expect(result.moderate.annualGrowthRate).toBeGreaterThan(0);
    expect(result.moderate.fromYear).toBeDefined();
    expect(result.moderate.toYear).toBeDefined();
    expect(result.moderate.dataPointCount).toBeGreaterThan(0);
  });

  it("respects a custom spread", () => {
    const narrow = projectSalarioMinimoScenarios(SAMPLE_DATA, 2030, 0.01);
    const wide = projectSalarioMinimoScenarios(SAMPLE_DATA, 2030, 0.04);
    const narrowSpread = narrow.fast.projectedValue - narrow.slow.projectedValue;
    const wideSpread = wide.fast.projectedValue - wide.slow.projectedValue;
    expect(wideSpread).toBeGreaterThan(narrowSpread);
  });

  it("all scenarios start from the same base value (latest data point)", () => {
    const result = projectSalarioMinimoScenarios(SAMPLE_DATA, 2030);
    expect(result.slow.baseValue).toBe(result.moderate.baseValue);
    expect(result.moderate.baseValue).toBe(result.fast.baseValue);
    expect(result.moderate.baseValue).toBe(3_000_000); // latest in SAMPLE_DATA
  });
});
