export interface SalarioMinimoDataPoint {
  year: number;
  monthly_pyg: number;
}

export interface SalarioMinimoScenario {
  annualGrowthRate: number;
  projectedValue: number;
  baseValue: number;
  baseYear: number;
  fromYear: number;
  toYear: number;
  dataPointCount: number;
  label: string;
}

export interface SalarioMinimoScenarios {
  slow: SalarioMinimoScenario;
  moderate: SalarioMinimoScenario;
  fast: SalarioMinimoScenario;
}

/**
 * Computes the compound annual growth rate (CAGR) between two years in the dataset.
 * If fromYear/toYear are omitted, uses the first and last available data points.
 */
export function computeCAGR(
  data: SalarioMinimoDataPoint[],
  fromYear?: number,
  toYear?: number
): number {
  const sorted = [...data].sort((a, b) => a.year - b.year);

  const start = fromYear !== undefined
    ? sorted.find((d) => d.year >= fromYear)
    : sorted[0];
  const end = toYear !== undefined
    ? [...sorted].reverse().find((d) => d.year <= toYear)
    : sorted[sorted.length - 1];

  if (!start || !end || start === end) {
    throw new Error("Not enough data points to compute CAGR for the given range");
  }

  const years = end.year - start.year;
  return Math.pow(end.monthly_pyg / start.monthly_pyg, 1 / years) - 1;
}

export interface ProjectParams {
  currentValue: number;
  currentYear: number;
  targetYear: number;
  annualGrowthRate: number;
}

/**
 * Projects a value forward using compound annual growth.
 */
export function projectSalarioMinimo({
  currentValue,
  currentYear,
  targetYear,
  annualGrowthRate,
}: ProjectParams): number {
  if (targetYear < currentYear) {
    throw new Error("targetYear must be >= currentYear");
  }
  if (targetYear === currentYear) return currentValue;
  const years = targetYear - currentYear;
  return currentValue * Math.pow(1 + annualGrowthRate, years);
}

/**
 * Projects three scenarios for the salario mínimo at a future target year.
 *
 * Uses the historical CAGR (full dataset) as the base, then applies a spread:
 * - slow:     baseRate - spread  (salario mínimo grows less than historical)
 * - moderate: baseRate           (salario mínimo follows historical trend)
 * - fast:     baseRate + spread  (salario mínimo grows more than historical)
 *
 * Note: a faster-growing salario mínimo means your pension is worth LESS
 * in relative terms, so "fast" is the unfavorable scenario for the pensioner.
 */
export function projectSalarioMinimoScenarios(
  data: SalarioMinimoDataPoint[],
  targetYear: number,
  spread = 0.02
): SalarioMinimoScenarios {
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const baseRate = computeCAGR(data);
  const base = last.monthly_pyg;
  const baseYear = last.year;
  const dataPointCount = sorted.length;

  function makeScenario(
    rate: number,
    label: string
  ): SalarioMinimoScenario {
    return {
      annualGrowthRate: rate,
      projectedValue: projectSalarioMinimo({
        currentValue: base,
        currentYear: baseYear,
        targetYear,
        annualGrowthRate: rate,
      }),
      baseValue: base,
      baseYear,
      fromYear: first.year,
      toYear: last.year,
      dataPointCount,
      label,
    };
  }

  return {
    slow: makeScenario(Math.max(0, baseRate - spread), "Crecimiento lento"),
    moderate: makeScenario(baseRate, "Crecimiento histórico"),
    fast: makeScenario(baseRate + spread, "Crecimiento alto"),
  };
}
