"use client";

import { useState } from "react";
import SalarioMinimoChart from "@/components/SalarioMinimoChart";
import YoYGrowthChart from "@/components/YoYGrowthChart";
import type { SalarioMinimoDataPoint, SalarioMinimoScenarios } from "@/lib/salarioMinimo";

interface Props {
  historicalData: SalarioMinimoDataPoint[];
  scenarios: SalarioMinimoScenarios;
  targetYear: number;
}

function ModelCard({ scenarios }: { scenarios: SalarioMinimoScenarios }) {
  const { moderate } = scenarios;
  const r = moderate.annualGrowthRate;
  const rPct = (r * 100).toFixed(2);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-gray-200">Modelo utilizado: CAGR (crecimiento compuesto anual)</h3>
        <p className="text-sm text-gray-400 mt-1">
          No usamos regresión lineal ni polinómica. Los salarios se ajustan por porcentaje, no en montos fijos,
          por lo que el crecimiento es naturalmente exponencial. El modelo correcto es el de interés compuesto:
        </p>
      </div>

      <div className="bg-gray-900 rounded border border-gray-700 px-4 py-3 font-mono text-sm text-gray-300">
        <p>S(t) = S₀ × (1 + r)^t</p>
        <p className="text-gray-500 mt-1 text-xs">
          S₀ = salario mínimo base · r = tasa de crecimiento anual · t = años hacia el futuro
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
        <div className="bg-gray-900 rounded border border-gray-700 p-3">
          <p className="text-xs text-gray-500">Período del CAGR</p>
          <p className="font-semibold text-gray-200">{moderate.fromYear}–{moderate.toYear}</p>
        </div>
        <div className="bg-gray-900 rounded border border-gray-700 p-3">
          <p className="text-xs text-gray-500">Datos disponibles</p>
          <p className="font-semibold text-gray-200">{moderate.dataPointCount} puntos</p>
        </div>
        <div className="bg-gray-900 rounded border border-gray-700 p-3">
          <p className="text-xs text-gray-500">CAGR histórico</p>
          <p className="font-semibold text-blue-400">{rPct}% anual</p>
        </div>
        <div className="bg-gray-900 rounded border border-gray-700 p-3">
          <p className="text-xs text-gray-500">Spread de escenarios</p>
          <p className="font-semibold text-gray-200">±2 pp</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Escenarios</p>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            <span className="text-gray-300">Lento: {((scenarios.slow.annualGrowthRate) * 100).toFixed(2)}% — el salario mínimo crece menos que el promedio histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-300">Histórico: {rPct}% — el salario mínimo mantiene su ritmo de crecimiento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-300">Alto: {((scenarios.fast.annualGrowthRate) * 100).toFixed(2)}% — mayor inflación o presión salarial</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          A mayor crecimiento del salario mínimo, menor es el poder adquisitivo relativo de tu jubilación.
          El escenario "alto" es el desfavorable para el jubilado.
        </p>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nominal vs real: por qué estas cifras no son tan alarmantes como parecen</p>
        <p className="text-sm text-gray-400">
          Todos los valores son <strong>nominales</strong>: incluyen inflación futura. El fondo de jubilación también crece en términos nominales
          (el rendimiento del fondo ya incorpora inflación). Lo que importa es la diferencia real entre ambos.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Dato histórico: el salario mínimo paraguayo <strong>perdió</strong> aproximadamente un 24% de poder adquisitivo real
          entre 1989 y 2025 (inflación acumulada 2.005% vs ajustes salariales 1.600%). En términos reales, el salario mínimo
          ha crecido cerca de 0% o negativo por año, mientras que los fondos de jubilación privada bien gestionados
          históricamente rinden 3-7% real anual por encima de la inflación.
          La brecha real suele favorecer al jubilado, aunque no está garantizada.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Fuente: economia.com.py, Superintendencia de Pensiones de Chile (AFP Fund C: +7.26% real anual desde 1981).
        </p>
      </div>
    </div>
  );
}

export default function MathSection({ historicalData, scenarios, targetYear }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-800 hover:bg-gray-700 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-300">
          Ver modelo matemático y datos históricos
        </span>
        <span className="text-gray-500 text-lg leading-none">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-6 p-5 bg-gray-900">
          <div>
            <h3 className="font-semibold text-gray-200 mb-3">Evolución histórica del salario mínimo + proyección</h3>
            <SalarioMinimoChart historicalData={historicalData} scenarios={scenarios} targetYear={targetYear} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-200 mb-3">Crecimiento año a año (varianza histórica)</h3>
            <YoYGrowthChart historicalData={historicalData} historicalCAGR={scenarios.moderate.annualGrowthRate} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-200 mb-3">Modelo y parámetros</h3>
            <ModelCard scenarios={scenarios} />
          </div>
        </div>
      )}
    </div>
  );
}
