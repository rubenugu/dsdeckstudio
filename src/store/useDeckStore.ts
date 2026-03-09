import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateNextReview } from "@/utils/sm2";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DSCategory =
  | "Statistics"
  | "Machine Learning"
  | "Deep Learning"
  | "Python & Libraries"
  | "Data Wrangling"
  | "Data Visualization"
  | "SQL & Databases"
  | "Feature Engineering"
  | "Model Evaluation"
  | "MLOps";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Flashcard {
  id: string;
  category: DSCategory;
  subcategory: string;
  front: string;
  back: string;
  shortAnswer?: string;  // Optional short answer for Quick Quiz choices
  codeExample?: string;
  difficulty: Difficulty;
  tags: string[];
  created: string;
  lastReviewed?: string;
  nextReview?: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  quality?: number;
}

// ── 20 Seed cards ─────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

const SEED_CARDS: Flashcard[] = [
  // ── Sample cards (shown to new users as examples) ──────────────────────────
  {
    id: "card_a3b4c5d6",
    category: "Data Wrangling",
    subcategory: "Pandas - Indexación",
    front: "¿Cuál es la diferencia entre `.loc[]` e `.iloc[]` en pandas?",
    back: "`.loc[]` indexa por etiquetas (nombres de filas/columnas o índices explícitos) e incluye el valor final en slices. `.iloc[]` indexa por posición entera (como slicing de listas) y excluye el valor final. Cuando el índice es el numérico por defecto, pueden coincidir, pero su comportamiento en slicing es diferente.",
    shortAnswer: ".loc usa etiquetas (incluye fin); .iloc usa posición (excluye fin).",
    codeExample: "df = data.set_index('ciudad').sort_index()\n\n# .loc - por etiqueta, extremo incluido\ndf.loc['Guadalajara':'Monterrey', 'ventas':'margen']\n\n# .iloc - por posición, extremo excluido\ndata.iloc[0:5]        # filas 0,1,2,3,4\ndata.iloc[0:5, 0:3]   # filas 0-4, columnas 0-2",
    difficulty: "intermediate",
    tags: ["loc", "iloc", "indexación", "pandas", "slicing"],
    created: daysAgo(0), repetitions: 0, easeFactor: 2.5, interval: 0,
  },
  {
    id: "card_o1p2q3r4",
    category: "Data Wrangling",
    subcategory: "Pandas - Agrupación",
    front: "¿Cómo funciona `groupby()` en pandas y cuándo usar `.agg()` en lugar de `.mean()` directamente?",
    back: "`groupby('col')` agrupa el DataFrame por los valores únicos de una columna. Con un método directo como `.mean()` obtienes una sola métrica. Con `.agg()` puedes aplicar múltiples funciones de agregación a la vez, recibiendo una columna por función. Las funciones se pasan como strings porque pandas reconoce sus nombres integrados.",
    shortAnswer: "groupby agrupa; .agg() aplica múltiples métricas a la vez.",
    codeExample: "import pandas as pd\n\n# Una sola métrica\ndata.groupby('ciudad')['ventas'].mean()\n\n# Múltiples métricas con .agg()\ndata.groupby('ciudad')['ventas'].agg(['min', 'max', 'mean', 'median'])\n\n# Con diccionario para renombrar columnas resultado\ndata.groupby('ciudad').agg(\n    promedio=('ventas', 'mean'),\n    total=('ventas', 'sum')\n)",
    difficulty: "intermediate",
    tags: ["groupby", "agg", "agregación", "pandas"],
    created: daysAgo(0), repetitions: 0, easeFactor: 2.5, interval: 0,
  },
  {
    id: "card_u1v2w3x4",
    category: "Python & Libraries",
    subcategory: "Strings",
    front: "¿Qué son los f-strings y por qué se prefieren sobre la concatenación o `.format()`?",
    back: "Los f-strings (f'...') permiten incrustar expresiones Python directamente en el string usando `{variable}`. Son más legibles, más rápidos en ejecución y permiten expresiones completas dentro de las llaves. Se prefieren sobre `+` (concatenación propensa a errores de tipo) y sobre `.format()` (más verboso).",
    shortAnswer: "Interpolación directa con f''; más legible y rápido.",
    codeExample: "nombre = \"Ana\"\nedad = 25\n\n# f-string (recomendado)\nmensaje = f\"Hola, soy {nombre} y tengo {edad} años\"\n\n# Expresiones dentro de las llaves\nprint(f\"El doble de edad: {edad * 2}\")\nprint(f\"Mayúsculas: {nombre.upper()}\")",
    difficulty: "beginner",
    tags: ["f-strings", "formateo", "strings", "interpolación"],
    created: daysAgo(0), repetitions: 0, easeFactor: 2.5, interval: 0,
  },
  {
    id: "card_y5z6a7b8",
    category: "Python & Libraries",
    subcategory: "Manejo de errores",
    front: "¿Cómo funciona el bloque `try-except` en Python y cuándo usarlo?",
    back: "El bloque `try` ejecuta código que podría fallar. Si ocurre una excepción, `except` la captura y ejecuta código alternativo sin romper el programa. Se puede especificar el tipo de error (ej. `ZeroDivisionError`, `TypeError`) para manejar casos distintos de forma diferenciada.",
    shortAnswer: "try ejecuta; except captura errores sin romper el programa.",
    codeExample: "try:\n    resultado = int(input(\"Ingresa un número: \"))\n    print(10 / resultado)\nexcept ZeroDivisionError:\n    print(\"No se puede dividir entre cero.\")\nexcept ValueError:\n    print(\"Eso no es un número válido.\")",
    difficulty: "beginner",
    tags: ["try-except", "errores", "excepciones", "manejo de errores"],
    created: daysAgo(0), repetitions: 0, easeFactor: 2.5, interval: 0,
  },
  {
    id: "card_e5f6g7h8",
    category: "Machine Learning",
    subcategory: "Flujo de trabajo",
    front: "¿Cuáles son las etapas del flujo de trabajo en un proyecto de Data Science?",
    back: "1. Levantamiento de requisitos (entender las necesidades del cliente). 2. Combinación de datos de diferentes fuentes. 3. Preparación de datos (limpiar, formatear, estandarizar). 4. Análisis de datos. La etapa más crítica es la primera: comprender qué busca el cliente antes de trabajar.",
    shortAnswer: "Requisitos → Combinar → Preparar → Analizar.",
    codeExample: undefined,
    difficulty: "beginner",
    tags: ["flujo de trabajo", "pipeline", "proceso", "data science"],
    created: daysAgo(0), repetitions: 0, easeFactor: 2.5, interval: 0,
  },
  // ── Demo cards (pre-reviewed, show real SM-2 in action) ────────────────────
  {
    id: "s-01", category: "Statistics", subcategory: "Probability",
    front: "What is the Central Limit Theorem?",
    back: "The CLT states that the sampling distribution of the sample mean approaches a normal distribution as sample size n → ∞, regardless of the population's distribution.\n\nKey implications:\n• Works for n ≥ 30 in practice\n• Mean of sampling dist = population mean μ\n• Std error = σ / √n\n• Underpins most parametric hypothesis tests",
    difficulty: "intermediate", tags: ["clt", "sampling", "probability", "fundamentals"],
    created: daysAgo(14), lastReviewed: daysAgo(3), nextReview: daysAgo(-4), repetitions: 4, easeFactor: 2.6, interval: 7, quality: 4,
  },
  {
    id: "s-02", category: "Statistics", subcategory: "Hypothesis Testing",
    front: "Explain p-value in hypothesis testing",
    back: "The p-value is the probability of observing results at least as extreme as the data, assuming H₀ is true.\n\n• p < α (0.05): reject H₀ → result is 'statistically significant'\n• p ≥ α: fail to reject H₀\n\nCommon misinterpretations to avoid:\n✗ p-value is NOT the probability that H₀ is true\n✗ Low p-value does NOT imply practical significance\n✓ Always report effect size alongside p-value",
    difficulty: "intermediate", tags: ["hypothesis-testing", "p-value", "statistics"],
    created: daysAgo(10), lastReviewed: daysAgo(5), nextReview: daysAgo(-2), repetitions: 3, easeFactor: 2.4, interval: 8, quality: 3,
  },
  {
    id: "ml-01", category: "Machine Learning", subcategory: "Fundamentals",
    front: "Explain the Bias-Variance Tradeoff",
    back: "Total prediction error = Bias² + Variance + Irreducible Noise\n\nBias: error from overly simplistic assumptions (underfitting).\nVariance: error from excessive sensitivity to training data (overfitting).\n\nGoal: find the sweet spot that minimises total test error.",
    difficulty: "intermediate", tags: ["bias", "variance", "overfitting"],
    created: daysAgo(20), lastReviewed: daysAgo(4), nextReview: daysAgo(-3), repetitions: 6, easeFactor: 2.5, interval: 9, quality: 4,
  },
  {
    id: "ml-02", category: "Machine Learning", subcategory: "Regularisation",
    front: "What is Regularisation and when do you use it?",
    back: "Regularisation adds a penalty term to the loss function to discourage model complexity.\n\nL1 (Lasso): λ Σ|wᵢ| → sparse weights\nL2 (Ridge): λ Σwᵢ² → shrinks all weights\nElasticNet: combination of L1 and L2",
    codeExample: `from sklearn.linear_model import Ridge, Lasso\nridge = Ridge(alpha=1.0).fit(X_train, y_train)\nlasso = Lasso(alpha=0.1).fit(X_train, y_train)`,
    difficulty: "intermediate", tags: ["regularisation", "lasso", "ridge"],
    created: daysAgo(15), lastReviewed: daysAgo(7), nextReview: daysAgo(-1), repetitions: 4, easeFactor: 2.3, interval: 8, quality: 3,
  },
  {
    id: "py-01", category: "Python & Libraries", subcategory: "pandas",
    front: "pandas groupby + agg pattern",
    back: "groupby splits a DataFrame into groups, apply runs a function per group, and combine assembles the results.\n\n• df.groupby('col')['val'].mean()\n• df.groupby('col').agg({'a': 'sum', 'b': ['mean','std']})\n• Named aggs: df.groupby('col').agg(total=('sales','sum'))",
    codeExample: `summary = df.groupby('region').agg(\n  total_sales=('sales', 'sum'),\n  avg_cost=('cost', 'mean'),\n).reset_index()`,
    difficulty: "beginner", tags: ["pandas", "groupby", "aggregation"],
    created: daysAgo(6), lastReviewed: daysAgo(1), nextReview: daysAgo(-8), repetitions: 7, easeFactor: 2.8, interval: 14, quality: 5,
  },
  {
    id: "sql-01", category: "SQL & Databases", subcategory: "Joins",
    front: "What is the difference between INNER, LEFT, RIGHT, and FULL OUTER JOIN?",
    back: "INNER JOIN: rows matching in both tables.\nLEFT JOIN: all left + matching right; NULLs if no match.\nRIGHT JOIN: all right + matching left.\nFULL OUTER JOIN: all rows from both; NULLs where no match.",
    difficulty: "beginner", tags: ["sql", "joins", "databases"],
    created: daysAgo(13), lastReviewed: daysAgo(5), nextReview: daysAgo(-2), repetitions: 5, easeFactor: 2.7, interval: 11, quality: 5,
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

export interface StudySession {
  date: string;
  reviewed: number;
  accuracy: number;
  durationSec: number;
}

interface DeckState {
  cards: Flashcard[];
  streak: number;
  lastStudyDate: string | null;
  activeNav: string;
  studySessions: StudySession[];

  // CRUD
  addCard:     (card: Omit<Flashcard, "id" | "created" | "repetitions" | "easeFactor" | "interval">) => Flashcard;
  updateCard:  (id: string, updates: Partial<Flashcard>) => void;
  deleteCard:  (id: string) => void;
  recordReview:(id: string, quality: number) => Flashcard | null;
  addStudySession: (session: StudySession) => void;
  setActiveNav:(nav: string) => void;
  resetStreak: () => void;
  resetReviewSchedule: () => Flashcard[];

  // Sync helpers (called by useSupabaseSync)
  setCards:        (cards: Flashcard[]) => void;
  setSessions:     (sessions: StudySession[]) => void;
  setStreak:       (streak: number) => void;
  setLastStudyDate:(d: string | null) => void;
}

export const DS_CATEGORIES: DSCategory[] = [
  "Statistics", "Machine Learning", "Deep Learning", "Python & Libraries",
  "Data Wrangling", "Data Visualization", "SQL & Databases",
  "Feature Engineering", "Model Evaluation", "MLOps",
];

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      cards:          SEED_CARDS,
      streak:         3,
      lastStudyDate:  null,
      activeNav:      "dashboard",
      studySessions:  [],

      setCards:        (cards)   => set({ cards }),
      setSessions:     (studySessions) => set({ studySessions }),
      setStreak:       (streak)  => set({ streak }),
      setLastStudyDate:(d)       => set({ lastStudyDate: d }),

      addCard: (card) => {
        const newCard: Flashcard = {
          ...card,
          id:          crypto.randomUUID(),
          created:     new Date().toISOString(),
          repetitions: 0,
          easeFactor:  2.5,
          interval:    1,
        };
        set((state) => ({ cards: [...state.cards, newCard] }));
        return newCard;
      },

      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),

      recordReview: (id, quality) => {
        const state   = get();
        const today   = new Date().toDateString();
        const lastStudy = state.lastStudyDate;
        const newStreak =
          lastStudy === today
            ? state.streak
            : lastStudy === new Date(Date.now() - 86400000).toDateString()
            ? state.streak + 1
            : 1;

        const card = state.cards.find((c) => c.id === id);
        if (!card) return null;
        const updated = { ...card, ...calculateNextReview(card, quality) };

        set({
          streak:        newStreak,
          lastStudyDate: today,
          cards:         state.cards.map((c) => (c.id === id ? updated : c)),
        });
        return updated;
      },

      addStudySession: (session) =>
        set((state) => ({
          studySessions: [...(state.studySessions ?? []), session].slice(-50),
        })),

      setActiveNav: (nav) => set({ activeNav: nav }),

      resetStreak: () => set({ streak: 0, lastStudyDate: null }),

      resetReviewSchedule: () => {
        const reset = get().cards.map((c) => ({
          ...c,
          repetitions:  0,
          easeFactor:   2.5,
          interval:     0,
          lastReviewed: undefined,
          nextReview:   undefined,
          quality:      undefined,
        }));
        set({ cards: reset });
        return reset;
      },
    }),
    { name: "dsdeck_cards" }
  )
);
