"use client";

export type FundScenario = "pessimistic" | "base" | "optimistic";
export type SalarioScenario = "slow" | "moderate" | "fast";

interface Props {
  fundScenario: FundScenario;
  onFundScenario: (s: FundScenario) => void;
  salarioScenario: SalarioScenario;
  onSalarioScenario: (s: SalarioScenario) => void;
}

const FUND_OPTIONS: { value: FundScenario; label: string; description: string }[] = [
  { value: "pessimistic", label: "Pesimista", description: "rendimiento bajo" },
  { value: "base", label: "Esperado", description: "rendimiento base" },
  { value: "optimistic", label: "Optimista", description: "rendimiento alto" },
];

const SALARIO_OPTIONS: { value: SalarioScenario; label: string; description: string }[] = [
  { value: "slow", label: "Lento", description: "salario crece poco" },
  { value: "moderate", label: "Histórico", description: "tendencia reciente" },
  { value: "fast", label: "Alto", description: "salario crece mucho" },
];

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; description: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-xs font-medium text-gray-500 sm:w-52 shrink-0">{label}</span>
      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
        {options.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              i > 0 ? "border-l border-gray-200" : ""
            } ${
              value === opt.value
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ScenarioSelector({
  fundScenario,
  onFundScenario,
  salarioScenario,
  onSalarioScenario,
}: Props) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
          Escenario activo
        </span>
        <span className="text-xs text-blue-500">
          · las secciones de abajo responden a esta selección
        </span>
      </div>
      <PillGroup
        label="Rendimiento del fondo"
        options={FUND_OPTIONS}
        value={fundScenario}
        onChange={onFundScenario}
      />
      <PillGroup
        label="Crecimiento del salario mínimo"
        options={SALARIO_OPTIONS}
        value={salarioScenario}
        onChange={onSalarioScenario}
      />
    </div>
  );
}
