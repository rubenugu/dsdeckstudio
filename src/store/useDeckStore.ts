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
