import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Difficulty = "easy" | "medium" | "hard";
export type Category =
  | "Python"
  | "Statistics"
  | "ML"
  | "Deep Learning"
  | "SQL"
  | "Data Engineering"
  | "Other";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: Category;
  difficulty: Difficulty;
  createdAt: number;
  lastReviewed: number | null;
  timesReviewed: number;
  timesCorrect: number;
  tags: string[];
}

interface DeckState {
  cards: Flashcard[];
  streak: number;
  lastStudyDate: string | null;
  activeNav: string;
  addCard: (card: Omit<Flashcard, "id" | "createdAt" | "lastReviewed" | "timesReviewed" | "timesCorrect">) => void;
  updateCard: (id: string, updates: Partial<Flashcard>) => void;
  deleteCard: (id: string) => void;
  recordReview: (id: string, correct: boolean) => void;
  setActiveNav: (nav: string) => void;
}

const SEED_CARDS: Flashcard[] = [
  {
    id: "seed-1",
    question: "What is the bias-variance tradeoff?",
    answer:
      "Bias is error from wrong assumptions; variance is error from sensitivity to training data fluctuations. Reducing one often increases the other. The total error = Bias² + Variance + Irreducible Noise.",
    category: "Statistics",
    difficulty: "medium",
    createdAt: Date.now() - 86400000 * 5,
    lastReviewed: Date.now() - 86400000 * 2,
    timesReviewed: 4,
    timesCorrect: 3,
    tags: ["bias", "variance", "fundamentals"],
  },
  {
    id: "seed-2",
    question: "Explain the difference between `loc` and `iloc` in pandas.",
    answer:
      "`loc` is label-based — it selects by index labels.\n`iloc` is integer-based — it selects by positional index.\n\nExample:\n  df.loc['row_label', 'col_label']\n  df.iloc[0, 1]  # row 0, col 1",
    category: "Python",
    difficulty: "easy",
    createdAt: Date.now() - 86400000 * 3,
    lastReviewed: Date.now() - 86400000,
    timesReviewed: 6,
    timesCorrect: 6,
    tags: ["pandas", "indexing"],
  },
  {
    id: "seed-3",
    question: "What is a confusion matrix?",
    answer:
      "A table showing TP, FP, FN, TN for a classifier.\n\n  Predicted+  Predicted-\nActual+    TP          FN\nActual-    FP          TN\n\nDerived metrics: Precision = TP/(TP+FP), Recall = TP/(TP+FN)",
    category: "ML",
    difficulty: "easy",
    createdAt: Date.now() - 86400000 * 7,
    lastReviewed: Date.now() - 86400000 * 4,
    timesReviewed: 8,
    timesCorrect: 7,
    tags: ["evaluation", "classification"],
  },
  {
    id: "seed-4",
    question: "What is gradient descent?",
    answer:
      "An optimization algorithm that iteratively moves parameters in the direction of steepest descent of the loss function.\n\nUpdate rule:\n  θ = θ - α · ∇L(θ)\n\nwhere α is the learning rate and ∇L(θ) is the gradient.",
    category: "ML",
    difficulty: "medium",
    createdAt: Date.now() - 86400000 * 10,
    lastReviewed: Date.now() - 86400000 * 6,
    timesReviewed: 5,
    timesCorrect: 4,
    tags: ["optimization", "fundamentals"],
  },
  {
    id: "seed-5",
    question: "What does a p-value tell you?",
    answer:
      "The probability of observing results at least as extreme as the current data, assuming the null hypothesis is true.\n\nA p-value < 0.05 means results are statistically significant at the 5% level — but it does NOT tell you the probability that H₀ is true.",
    category: "Statistics",
    difficulty: "hard",
    createdAt: Date.now() - 86400000 * 2,
    lastReviewed: null,
    timesReviewed: 0,
    timesCorrect: 0,
    tags: ["hypothesis-testing", "statistics"],
  },
];

export const useDeckStore = create<DeckState>()(
  persist(
    (set) => ({
      cards: SEED_CARDS,
      streak: 3,
      lastStudyDate: null,
      activeNav: "dashboard",

      addCard: (card) =>
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              lastReviewed: null,
              timesReviewed: 0,
              timesCorrect: 0,
            },
          ],
        })),

      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),

      recordReview: (id, correct) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id
              ? {
                  ...c,
                  lastReviewed: Date.now(),
                  timesReviewed: c.timesReviewed + 1,
                  timesCorrect: c.timesCorrect + (correct ? 1 : 0),
                }
              : c
          ),
        })),

      setActiveNav: (nav) => set({ activeNav: nav }),
    }),
    { name: "ds-deck-storage" }
  )
);
