"use client";

import { useState, useId } from "react";

export interface CalculatorInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyContribution: number;
  existingFund: number;
  currentSalary: number;
  annualReturnRate: number;
  annualFeeRate: number;
  scenarioSpread: number;
}

// Salario mínimo legal vigente 2025 (vigente desde julio 2025)
export const SALARIO_MINIMO_2025 = 2_899_048;
export const SALARIO_MINIMO_SOURCE = "MTESS Paraguay / impuestospy.com";

const DEFAULTS: CalculatorInputs = {
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 80,
  monthlyContribution: 500_000,
  existingFund: 0,
  currentSalary: SALARIO_MINIMO_2025,
  annualReturnRate: 8,
  annualFeeRate: 1.5,
  scenarioSpread: 1.5,
};

interface Props {
  values: CalculatorInputs;
  onChange: (values: CalculatorInputs) => void;
  growthRate: number;
  onGrowthRateChange: (r: number) => void;
  salarioCagrRate: number;
}

interface PickerProps {
  value: number;
  onChange: (r: number) => void;
  salarioCagrRate: number;
}

function pct(r: number) {
  return `${(r * 100).toFixed(1)}%`;
}

function ContributionGrowthPicker({ value, onChange, salarioCagrRate }: PickerProps) {
  const customId = useId();
  const presets = [
    { rate: 0,               label: "Nunca lo ajusto",   sub: "0%/año" },
    { rate: 0.03,             label: "Al ritmo del IPC",            sub: "~3%/año" },
    { rate: salarioCagrRate, label: "Al ritmo del sal. mínimo",    sub: `${pct(salarioCagrRate)}/año` },
  ];
  const matchesPreset = presets.some((p) => Math.abs(p.rate - value) < 1e-5);
  const [customStr, setCustomStr] = useState(() =>
    matchesPreset ? "" : String((value * 100).toFixed(1))
  );
  const [customActive, setCustomActive] = useState(!matchesPreset);

  function selectPreset(rate: number) {
    setCustomActive(false);
    onChange(rate);
  }

  function activateCustom() {
    setCustomActive(true);
    const initial = matchesPreset ? "5" : String((value * 100).toFixed(1));
    setCustomStr(initial);
    const n = parseFloat(initial);
    if (!isNaN(n)) onChange(n / 100);
  }

  function handleCustomInput(str: string) {
    const clean = str.replace(/[^0-9.]/g, "");
    setCustomStr(clean);
    const n = parseFloat(clean);
    if (!isNaN(n)) onChange(n / 100);
  }

  const activePreset = !customActive ? presets.find((p) => Math.abs(p.rate - value) < 1e-5) : null;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">
        Ajuste anual del aporte
      </label>
      <p className="text-xs text-gray-500">
        El monto que aportás cada mes, lo aumentas con el tiempo?
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = !customActive && activePreset?.rate === p.rate;
          return (
            <button
              key={p.rate}
              type="button"
              onClick={() => selectPreset(p.rate)}
              className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "border-blue-600 bg-blue-950 text-blue-300"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
              }`}
            >
              <span className="font-medium">{p.label}</span>
              <span className={`text-xs ${active ? "text-blue-400" : "text-gray-500"}`}>{p.sub}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={activateCustom}
          className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            customActive
              ? "border-blue-600 bg-blue-950 text-blue-300"
              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
          }`}
        >
          <span className="font-medium">Personalizado</span>
          <span className={`text-xs ${customActive ? "text-blue-400" : "text-gray-500"}`}>tu propio %</span>
        </button>
      </div>
      {customActive && (
        <div className="flex items-center gap-2 mt-1">
          <label htmlFor={customId} className="text-sm text-gray-400">Tasa anual:</label>
          <input
            id={customId}
            type="text"
            inputMode="decimal"
            value={customStr}
            onChange={(e) => handleCustomInput(e.target.value)}
            className="w-20 rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm text-gray-500">% / año</span>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  name: keyof CalculatorInputs;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  values: CalculatorInputs;
  onChange: (values: CalculatorInputs) => void;
}

function NumberField({ label, name, min, max, step = 1, suffix, values, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300" htmlFor={name}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={name}
          type="number"
          min={min}
          max={max}
          step={step}
          value={values[name]}
          onChange={(e) =>
            onChange({ ...values, [name]: Number(e.target.value) })
          }
          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        />
        {suffix && <span className="text-sm text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

function dotFormat(n: number): string {
  return n === 0 ? "0" : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function PYGField({ label, name, values, onChange }: Omit<FieldProps, "min" | "max" | "step" | "suffix">) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  const displayValue = editing ? raw : dotFormat(values[name] as number);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300" htmlFor={name}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={name}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onFocus={() => {
            setRaw(values[name] === 0 ? "" : String(values[name]));
            setEditing(true);
          }}
          onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={() => {
            const n = parseInt(raw, 10);
            onChange({ ...values, [name]: isNaN(n) ? 0 : n });
            setEditing(false);
          }}
          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">₲</span>
      </div>
    </div>
  );
}

export { DEFAULTS };

export default function CalculatorForm({ values, onChange, growthRate, onGrowthRateChange, salarioCagrRate }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Datos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Edad actual" name="currentAge" min={18} max={80} values={values} onChange={onChange} suffix="años" />
        <NumberField label="Edad de jubilación" name="retirementAge" min={55} max={90} values={values} onChange={onChange} suffix="años" />
        <NumberField label="Expectativa de vida" name="lifeExpectancy" min={60} max={120} values={values} onChange={onChange} suffix="años" />
        <PYGField label="Aporte mensual inicial" name="monthlyContribution" values={values} onChange={onChange} />
        <PYGField label="Saldo actual en la caja" name="existingFund" values={values} onChange={onChange} />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <PYGField label="Salario mínimo de referencia" name="currentSalary" values={values} onChange={onChange} />
          <p className="text-xs text-gray-500">
            Fuente: {SALARIO_MINIMO_SOURCE}. Usado para expresar la renta como múltiplo del salario mínimo.
          </p>
        </div>
        <NumberField label="Rendimiento anual del fondo" name="annualReturnRate" min={0} max={30} step={0.1} values={values} onChange={onChange} suffix="%" />
        <NumberField label="Comisión anual de administración" name="annualFeeRate" min={0} max={10} step={0.1} values={values} onChange={onChange} suffix="%" />
        <div className="flex flex-col gap-1">
          <NumberField label="Spread entre escenarios" name="scenarioSpread" min={0} max={10} step={0.1} values={values} onChange={onChange} suffix="pp" />
          <p className="text-xs text-gray-500">
            Qué tan separados están el escenario pesimista y el optimista del rendimiento base.
          </p>
        </div>
        <div className="sm:col-span-2 border-t border-gray-700 pt-4">
          <ContributionGrowthPicker value={growthRate} onChange={onGrowthRateChange} salarioCagrRate={salarioCagrRate} />
        </div>
      </div>
    </div>
  );
}
