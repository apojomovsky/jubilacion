/**
 * Formats a PYG value using dots as thousands separators (Paraguayan standard).
 * e.g. 1500000 → "₲ 1.500.000"
 *
 * Uses regex rather than Intl.NumberFormat to guarantee consistent output
 * regardless of the runtime's ICU locale data availability.
 */
export function formatPYG(value: number): string {
  const rounded = Math.round(value);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `₲\u00A0${formatted}`;
}
