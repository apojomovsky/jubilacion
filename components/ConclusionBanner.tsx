"use client";

import { formatPYG } from "@/lib/format";

interface Props {
  actualMultiple: number;
  targetMultiple: number;
  monthlyPayout: number;
  contributionGap: number; // extra monthly contribution needed; 0 if already covered
  targetYear: number;
}

export default function ConclusionBanner({
  actualMultiple,
  targetMultiple,
  monthlyPayout,
  contributionGap,
  targetYear,
}: Props) {
  const covered = contributionGap === 0;
  const ratio = actualMultiple / targetMultiple;

  const color = covered
    ? "border-green-800 bg-green-950"
    : ratio >= 0.8
      ? "border-yellow-800 bg-yellow-950"
      : "border-red-900 bg-red-950";

  const indicatorColor = covered
    ? "text-green-400"
    : ratio >= 0.8
      ? "text-yellow-400"
      : "text-red-400";

  const verdict = covered
    ? "Vas bien."
    : ratio >= 0.8
      ? "Casi. Falta poco."
      : "Necesitás aumentar tu aporte.";

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${color}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            Proyección al {targetYear}
          </p>
          <p className={`text-3xl font-bold ${indicatorColor}`}>
            {actualMultiple.toFixed(2)}x
            <span className="text-base font-normal text-gray-400 ml-2">sal. mínimo</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {formatPYG(monthlyPayout)}/mes · tu meta es {targetMultiple}x
          </p>
        </div>
        <p className={`text-lg font-semibold ${indicatorColor} whitespace-nowrap`}>{verdict}</p>
      </div>

      {!covered && (
        <p className="text-sm text-gray-300 border-t border-gray-700 pt-3">
          Para llegar a {targetMultiple}x el salario mínimo, necesitás{" "}
          <strong className="text-white">{formatPYG(contributionGap)} más por mes</strong>.
        </p>
      )}

      {covered && (
        <p className="text-sm text-gray-300 border-t border-gray-700 pt-3">
          Tu aporte actual cubre tu objetivo. Podés usar el modo avanzado para explorar escenarios y
          ajustes.
        </p>
      )}
    </div>
  );
}
