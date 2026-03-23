<p align="center">
  <img src="public/logo.svg" width="100" alt="Previsor logo" />
</p>

<h1 align="center">Previsor</h1>
<p align="center">Calculadora de jubilación privada para Paraguay</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/tests-39_passing-22c55e" alt="Tests" />
</p>

---

Previsor proyecta el fondo acumulado y la renta mensual de un sistema de capitalización individual, y lo compara contra el salario mínimo futuro de Paraguay. Diseñado para ser auditado: el modelo matemático está documentado en la propia app.

## Características

- Proyección del fondo acumulado al retiro bajo 3 escenarios de rendimiento (pesimista, esperado, optimista)
- Renta mensual estimada y comparación contra el salario mínimo proyectado
- 3 escenarios de crecimiento del salario mínimo basados en CAGR histórico (MTESS, 2010-hoy)
- Selector de ajuste anual del aporte: fijo, al IPC, al ritmo del salario mínimo, o personalizado
- Aporte requerido para alcanzar exactamente 1x salario mínimo al retiro
- Gráfico de crecimiento del fondo con glow sobre el escenario seleccionado
- Sección de modelo matemático con fórmulas y gráficos históricos
- Modo oscuro nativo, sin dependencias de extensiones del navegador
- Responsive: funciona en móvil con scroll horizontal en tablas anchas

## Stack

| Capa      | Tecnología               |
| --------- | ------------------------ |
| Framework | Next.js 16 (App Router)  |
| UI        | React 19, Tailwind CSS 4 |
| Gráficos  | Recharts 3               |
| Lenguaje  | TypeScript 5             |
| Tests     | Jest 30                  |

## Modelo matemático

Las proyecciones usan fórmulas estándar de valor futuro:

**Anualidad fija:**

```
FV = PMT × [((1 + r)^n − 1) / r]
```

**Anualidad creciente** (cuando el aporte aumenta cada año):

```
FV = PMT × [(1 + r)^n − (1 + g)^n] / (r − g)
```

donde `r` es la tasa mensual neta de comisión y `g` es la tasa mensual de crecimiento del aporte, derivada de la tasa anual via `(1 + G)^(1/12) − 1`.

El CAGR del salario mínimo se calcula desde 2010 para evitar sesgo por la alta inflación de décadas anteriores.

## Fuentes de datos

- **MTESS Paraguay / SIMEL:** evolución histórica del salario mínimo legal
- **impuestospy.com:** compilación de salarios mínimos 1992-2025
- **BCP:** Índice de Precios al Consumidor (IPC)
- **Superintendencia de Pensiones de Chile:** rentabilidad real histórica de fondos AFP (referencia comparativa)
- **OCDE Pensions at a Glance 2023:** supuestos actuariales estándar

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 39 tests
npm run build      # build de producción
```

## Aviso

Esta herramienta es exclusivamente orientativa y no constituye asesoramiento financiero ni previsional de ningún tipo. Los valores calculados son estimaciones basadas en modelos matemáticos y datos históricos que no garantizan resultados futuros.
