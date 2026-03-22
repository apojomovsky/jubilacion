"use client";

import { useState } from "react";

export interface CalculatorInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyContribution: number;
  existingFund: number;
  currentSalary: number;
  annualReturnRate: number;
  annualFeeRate: number;
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
};

interface Props {
  values: CalculatorInputs;
  onChange: (values: CalculatorInputs) => void;
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
      <label className="text-sm font-medium text-gray-700" htmlFor={name}>
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
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
      <label className="text-sm font-medium text-gray-700" htmlFor={name}>
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
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">₲</span>
      </div>
    </div>
  );
}

export { DEFAULTS };

export default function CalculatorForm({ values, onChange }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Datos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Edad actual" name="currentAge" min={18} max={80} values={values} onChange={onChange} suffix="años" />
        <NumberField label="Edad de jubilación" name="retirementAge" min={55} max={90} values={values} onChange={onChange} suffix="años" />
        <NumberField label="Expectativa de vida" name="lifeExpectancy" min={60} max={120} values={values} onChange={onChange} suffix="años" />
        <PYGField label="Aporte mensual" name="monthlyContribution" values={values} onChange={onChange} />
        <PYGField label="Saldo actual en la caja" name="existingFund" values={values} onChange={onChange} />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <PYGField label="Salario mínimo de referencia" name="currentSalary" values={values} onChange={onChange} />
          <p className="text-xs text-gray-400">
            Fuente: {SALARIO_MINIMO_SOURCE}. Usado para expresar la renta como múltiplo del salario mínimo.
          </p>
        </div>
        <NumberField label="Rendimiento anual del fondo" name="annualReturnRate" min={0} max={30} step={0.1} values={values} onChange={onChange} suffix="%" />
        <NumberField label="Comisión anual de administración" name="annualFeeRate" min={0} max={10} step={0.1} values={values} onChange={onChange} suffix="%" />
      </div>
    </div>
  );
}
