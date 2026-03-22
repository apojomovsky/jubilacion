"use client";

interface Source {
  name: string;
  description: string;
  url?: string;
}

const SOURCES: Source[] = [
  {
    name: "MTESS Paraguay",
    description: "Ministerio de Trabajo, Empleo y Seguridad Social — resoluciones de salario mínimo.",
  },
  {
    name: "impuestospy.com",
    description: "Compilación histórica de salarios mínimos legales vigentes 1992–2025 basada en datos del MTESS.",
    url: "https://impuestospy.com/salarios-minimos/",
  },
  {
    name: "Banco Central del Paraguay (BCP)",
    description: "Referencia macroeconómica para tasas de inflación e indicadores financieros de Paraguay.",
    url: "https://www.bcp.gov.py",
  },
  {
    name: "economia.com.py",
    description: "Análisis de poder adquisitivo real del salario mínimo paraguayo 1989–2025 (inflación acumulada 2.005% vs ajustes salariales 1.600%).",
    url: "https://economia.com.py/trabajadores-paraguayos-pierden-24-de-poder-adquisitivo-en-36-anos-mientras-debate-del-salario-minimo-expone-fallas-del-sistema-de-reajuste/",
  },
  {
    name: "Superintendencia de Pensiones de Chile",
    description: "Rentabilidad histórica real de fondos AFP desde julio de 1981 (Fondo C: +7.26% real anual acumulado). Referencia comparativa para sistemas de capitalización individual en Latinoamérica.",
    url: "https://www.spensiones.cl/apps/rentabilidad/getRentabilidad.php?tiprent=FP",
  },
  {
    name: "OCDE — Pensions at a Glance 2023",
    description: "Supuesto estándar de crecimiento real de salarios utilizado en proyecciones actuariales de largo plazo: 1.25% anual real.",
    url: "https://www.oecd.org/publications/oecd-pensions-at-a-glance-19991363.htm",
  },
];

export default function SourcesSection() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Aviso importante</p>
        <p className="text-sm text-amber-700">
          Esta herramienta es exclusivamente orientativa y <strong>no constituye asesoramiento financiero, previsional ni de ningún tipo</strong>.
          Los valores calculados son estimaciones basadas en modelos matemáticos y datos históricos que <strong>no garantizan resultados futuros</strong>.
          Las proyecciones dependen de supuestos que pueden no materializarse: rendimientos pasados no predicen rendimientos futuros,
          y las condiciones económicas pueden cambiar sustancialmente a lo largo de décadas.
          Consultá con un asesor financiero o previsional calificado antes de tomar cualquier decisión de ahorro o inversión.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Fuentes de datos</h2>
        <div className="flex flex-col gap-2">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex gap-3 text-sm">
              <span className="text-gray-400 mt-0.5">·</span>
              <div>
                <span className="font-medium text-gray-700">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-700">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </span>
                <span className="text-gray-500"> — {s.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Código fuente disponible y auditado. Los cálculos siguen fórmulas estándar de valor futuro de anualidades (fijas y crecientes)
        y CAGR (tasa de crecimiento anual compuesta). Ver sección "Modelo matemático" para detalles.
      </p>
    </div>
  );
}
