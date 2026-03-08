import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  front: string;           // question or concept
  back: string;            // answer or explanation
  codeExample?: string;    // optional Python code snippet
  difficulty: Difficulty;
  tags: string[];
  created: string;         // ISO string (serializable)
  lastReviewed?: string;
  nextReview?: string;
  repetitions: number;     // times reviewed
  easeFactor: number;      // SM-2 factor (starts at 2.5)
  interval: number;        // days until next review
  quality?: number;        // last review quality 0-5
}

// ── SM-2 helper ───────────────────────────────────────────────────────────────

export function sm2(card: Flashcard, quality: number): Partial<Flashcard> {
  // quality: 0-5  (0-2 = wrong, 3-5 = correct)
  const q = Math.max(0, Math.min(5, quality));
  const now = new Date();

  let { easeFactor, interval, repetitions } = card;

  if (q < 3) {
    // Wrong — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Correct
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    );
    repetitions += 1;
  }

  const nextReview = new Date(now.getTime() + interval * 86400000);

  return {
    easeFactor,
    interval,
    repetitions,
    quality: q,
    lastReviewed: now.toISOString(),
    nextReview: nextReview.toISOString(),
  };
}

// ── 20 Seed cards ─────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

const SEED_CARDS: Flashcard[] = [
  // ── Statistics ──────────────────────────────────────────────────────────────
  {
    id: "s-01",
    category: "Statistics",
    subcategory: "Probability",
    front: "What is the Central Limit Theorem?",
    back: "The CLT states that the sampling distribution of the sample mean approaches a normal distribution as sample size n → ∞, regardless of the population's distribution.\n\nKey implications:\n• Works for n ≥ 30 in practice\n• Mean of sampling dist = population mean μ\n• Std error = σ / √n\n• Underpins most parametric hypothesis tests",
    difficulty: "intermediate",
    tags: ["clt", "sampling", "probability", "fundamentals"],
    created: daysAgo(14),
    lastReviewed: daysAgo(3),
    nextReview: daysAgo(-4),
    repetitions: 4,
    easeFactor: 2.6,
    interval: 7,
    quality: 4,
  },
  {
    id: "s-02",
    category: "Statistics",
    subcategory: "Hypothesis Testing",
    front: "Explain p-value in hypothesis testing",
    back: "The p-value is the probability of observing results at least as extreme as the data, assuming H₀ is true.\n\n• p < α (0.05): reject H₀ → result is 'statistically significant'\n• p ≥ α: fail to reject H₀\n\nCommon misinterpretations to avoid:\n✗ p-value is NOT the probability that H₀ is true\n✗ Low p-value does NOT imply practical significance\n✓ Always report effect size alongside p-value",
    difficulty: "intermediate",
    tags: ["hypothesis-testing", "p-value", "statistics"],
    created: daysAgo(10),
    lastReviewed: daysAgo(5),
    nextReview: daysAgo(-2),
    repetitions: 3,
    easeFactor: 2.4,
    interval: 8,
    quality: 3,
  },
  {
    id: "s-03",
    category: "Statistics",
    subcategory: "Distributions",
    front: "What is the difference between Type I and Type II errors?",
    back: "Type I error (α — false positive): Rejecting H₀ when it is actually true.\nControlled by significance level α (typically 0.05).\n\nType II error (β — false negative): Failing to reject H₀ when it is false.\nPower = 1 - β (probability of correctly detecting a real effect).\n\nTradeoff: reducing α increases β. Use power analysis to balance both.",
    difficulty: "beginner",
    tags: ["hypothesis-testing", "errors", "power"],
    created: daysAgo(8),
    lastReviewed: daysAgo(1),
    nextReview: daysAgo(-6),
    repetitions: 5,
    easeFactor: 2.7,
    interval: 10,
    quality: 5,
  },

  // ── Machine Learning ─────────────────────────────────────────────────────────
  {
    id: "ml-01",
    category: "Machine Learning",
    subcategory: "Fundamentals",
    front: "Explain the Bias-Variance Tradeoff",
    back: "Total prediction error = Bias² + Variance + Irreducible Noise\n\nBias: error from overly simplistic assumptions (underfitting). High bias → model misses relevant relations.\n\nVariance: error from excessive sensitivity to training data (overfitting). High variance → model fits noise.\n\nGoal: find the sweet spot that minimises total test error. Regularisation, ensemble methods, and cross-validation help navigate this tradeoff.",
    difficulty: "intermediate",
    tags: ["bias", "variance", "overfitting", "underfitting"],
    created: daysAgo(20),
    lastReviewed: daysAgo(4),
    nextReview: daysAgo(-3),
    repetitions: 6,
    easeFactor: 2.5,
    interval: 9,
    quality: 4,
  },
  {
    id: "ml-02",
    category: "Machine Learning",
    subcategory: "Regularisation",
    front: "What is Regularisation and when do you use it?",
    back: "Regularisation adds a penalty term to the loss function to discourage model complexity and prevent overfitting.\n\nL1 (Lasso): penalty = λ Σ|wᵢ|  → produces sparse weights, built-in feature selection\nL2 (Ridge): penalty = λ Σwᵢ²   → shrinks all weights, handles multicollinearity\nElasticNet: combination of L1 and L2\n\nUse regularisation when:\n• Training error << validation error (overfitting)\n• Many correlated features\n• Dataset is small relative to feature count",
    codeExample: `from sklearn.linear_model import Ridge, Lasso, ElasticNet

# Ridge (L2)
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)

# Lasso (L1) — zeroes out weak features
lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)

# ElasticNet — mix of both
from sklearn.linear_model import ElasticNet
enet = ElasticNet(alpha=0.1, l1_ratio=0.5)
enet.fit(X_train, y_train)`,
    difficulty: "intermediate",
    tags: ["regularisation", "lasso", "ridge", "overfitting"],
    created: daysAgo(15),
    lastReviewed: daysAgo(7),
    nextReview: daysAgo(-1),
    repetitions: 4,
    easeFactor: 2.3,
    interval: 8,
    quality: 3,
  },
  {
    id: "ml-03",
    category: "Machine Learning",
    subcategory: "Ensembles",
    front: "Random Forest vs Gradient Boosting — when to use each?",
    back: "Random Forest:\n• Trains trees in parallel on random subsets (bagging)\n• Reduces variance; robust to outliers\n• Fast to train; easy to tune\n• Good default for structured data\n\nGradient Boosting (XGBoost, LightGBM, CatBoost):\n• Builds trees sequentially, each correcting previous errors\n• Reduces bias; often higher accuracy\n• More hyperparameters; prone to overfit without tuning\n• State-of-the-art for tabular competitions\n\nRule of thumb: Start with Random Forest for a quick baseline; switch to GBM when you need to squeeze extra performance.",
    difficulty: "intermediate",
    tags: ["random-forest", "gradient-boosting", "ensemble", "xgboost"],
    created: daysAgo(12),
    lastReviewed: daysAgo(2),
    nextReview: daysAgo(-5),
    repetitions: 5,
    easeFactor: 2.5,
    interval: 10,
    quality: 4,
  },

  // ── Deep Learning ─────────────────────────────────────────────────────────────
  {
    id: "dl-01",
    category: "Deep Learning",
    subcategory: "Training",
    front: "What is backpropagation?",
    back: "Backpropagation computes gradients of the loss with respect to every weight using the chain rule, then passes them backward through the network so gradient descent can update the weights.\n\nSteps:\n1. Forward pass: compute predictions and loss\n2. Backward pass: compute ∂L/∂wᵢ for each layer via chain rule\n3. Update: wᵢ ← wᵢ − α · ∂L/∂wᵢ\n\nKey insight: it's just efficient application of the chain rule — no magic, just calculus.",
    difficulty: "intermediate",
    tags: ["backprop", "chain-rule", "gradients", "neural-networks"],
    created: daysAgo(18),
    lastReviewed: daysAgo(6),
    nextReview: daysAgo(-2),
    repetitions: 3,
    easeFactor: 2.2,
    interval: 7,
    quality: 3,
  },
  {
    id: "dl-02",
    category: "Deep Learning",
    subcategory: "Regularisation",
    front: "Explain dropout regularisation in neural networks",
    back: "Dropout randomly sets a fraction p of neuron activations to zero during each training forward pass.\n\nWhy it works:\n• Forces the network to learn redundant representations\n• Prevents co-adaptation of neurons\n• Equivalent to training an ensemble of 2ⁿ thinned networks\n\nBest practices:\n• Typical p: 0.2–0.5 for hidden layers, 0.1 for input\n• Disable at inference (or scale activations by 1/(1-p))\n• Less effective with BatchNorm — use one or the other",
    codeExample: `import torch.nn as nn

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3),   # 30% dropout
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(64, 10),
        )

    def forward(self, x):
        return self.net(x)`,
    difficulty: "intermediate",
    tags: ["dropout", "regularisation", "pytorch", "neural-networks"],
    created: daysAgo(9),
    lastReviewed: daysAgo(2),
    nextReview: daysAgo(-4),
    repetitions: 4,
    easeFactor: 2.4,
    interval: 8,
    quality: 4,
  },

  // ── Python & Libraries ───────────────────────────────────────────────────────
  {
    id: "py-01",
    category: "Python & Libraries",
    subcategory: "pandas",
    front: "pandas groupby + agg pattern",
    back: "groupby splits a DataFrame into groups, apply runs a function per group, and combine assembles the results.\n\nCommon patterns:\n• Single aggregation: df.groupby('col')['val'].mean()\n• Multiple aggs: df.groupby('col').agg({'a': 'sum', 'b': ['mean','std']})\n• Named aggs (pandas ≥ 0.25): df.groupby('col').agg(total=('sales','sum'), avg=('sales','mean'))\n• Transform (same index): df.groupby('col')['val'].transform('mean')",
    codeExample: `import pandas as pd

df = pd.DataFrame({
    'region': ['North','North','South','South'],
    'sales':  [100, 200, 150, 50],
    'cost':   [80,  120, 90,  30],
})

# Named aggregation (recommended)
summary = (
    df.groupby('region')
      .agg(
          total_sales=('sales', 'sum'),
          avg_cost=('cost', 'mean'),
          n_rows=('sales', 'count'),
      )
      .reset_index()
)
print(summary)
# region  total_sales  avg_cost  n_rows
# North   300          100.0     2
# South   200          60.0      2`,
    difficulty: "beginner",
    tags: ["pandas", "groupby", "aggregation", "python"],
    created: daysAgo(6),
    lastReviewed: daysAgo(1),
    nextReview: daysAgo(-8),
    repetitions: 7,
    easeFactor: 2.8,
    interval: 14,
    quality: 5,
  },
  {
    id: "py-02",
    category: "Python & Libraries",
    subcategory: "Python Basics",
    front: "How does list comprehension work with conditions?",
    back: "Syntax:\n  [expression for item in iterable if condition]\n\nThe if clause filters items before the expression is evaluated.\n\nDouble loop:\n  [x*y for x in range(3) for y in range(3)]\n\nConditional expression (ternary) in the value:\n  [x if x > 0 else 0 for x in lst]",
    codeExample: `# Filter + transform in one line
nums = [1, -2, 3, -4, 5]

# Keep only positives and square them
squares = [x**2 for x in nums if x > 0]
# [1, 9, 25]

# Replace negatives with 0
clipped = [x if x > 0 else 0 for x in nums]
# [1, 0, 3, 0, 5]

# Flatten a 2-D list
matrix = [[1,2],[3,4],[5,6]]
flat = [val for row in matrix for val in row]
# [1, 2, 3, 4, 5, 6]`,
    difficulty: "beginner",
    tags: ["list-comprehension", "python", "basics"],
    created: daysAgo(5),
    lastReviewed: daysAgo(0),
    nextReview: daysAgo(-10),
    repetitions: 8,
    easeFactor: 2.9,
    interval: 15,
    quality: 5,
  },
  {
    id: "py-03",
    category: "Python & Libraries",
    subcategory: "NumPy",
    front: "What is broadcasting in NumPy?",
    back: "Broadcasting allows NumPy to perform element-wise operations on arrays with different shapes by virtually expanding the smaller array.\n\nRules (applied right-to-left on shapes):\n1. If arrays differ in ndim, prepend 1s to smaller shape\n2. Dimensions of size 1 are stretched to match the other\n3. If shapes still disagree → ValueError\n\nExample: (3,1) + (1,4) → (3,4)",
    codeExample: `import numpy as np

a = np.array([[1], [2], [3]])   # shape (3,1)
b = np.array([10, 20, 30, 40])  # shape (4,)

result = a + b  # shape (3,4)
# [[ 11  21  31  41]
#  [ 12  22  32  42]
#  [ 13  23  33  43]]

# Normalise each row: subtract row mean
X = np.random.rand(100, 5)
X_norm = X - X.mean(axis=1, keepdims=True)`,
    difficulty: "intermediate",
    tags: ["numpy", "broadcasting", "python"],
    created: daysAgo(7),
    lastReviewed: daysAgo(2),
    nextReview: daysAgo(-5),
    repetitions: 4,
    easeFactor: 2.4,
    interval: 9,
    quality: 4,
  },

  // ── Data Wrangling ───────────────────────────────────────────────────────────
  {
    id: "dw-01",
    category: "Data Wrangling",
    subcategory: "Missing Data",
    front: "Strategies for handling missing data",
    back: "1. Drop rows/columns: use when missingness is rare (<5%) and random (MCAR).\n2. Mean/Median/Mode imputation: simple; can distort variance.\n3. Regression imputation: predict missing from other features.\n4. Multiple imputation (MICE): models uncertainty; gold standard for research.\n5. Forward/Backward fill: for time-series.\n6. Indicator variable: add a binary 'was_missing' column alongside imputed value.\n\nKey: distinguish MCAR (random) vs MAR (depends on observed data) vs MNAR (depends on missing value itself). MNAR is hardest to handle.",
    codeExample: `import pandas as pd
from sklearn.impute import SimpleImputer, KNNImputer

df = pd.DataFrame({'age': [25, None, 35], 'income': [50k, 60k, None]})

# Simple median imputation
imp = SimpleImputer(strategy='median')
df_imputed = pd.DataFrame(imp.fit_transform(df), columns=df.columns)

# KNN imputation (uses similar rows)
knn_imp = KNNImputer(n_neighbors=3)
df_knn = pd.DataFrame(knn_imp.fit_transform(df), columns=df.columns)`,
    difficulty: "intermediate",
    tags: ["missing-data", "imputation", "pandas", "data-cleaning"],
    created: daysAgo(11),
    lastReviewed: daysAgo(4),
    nextReview: daysAgo(-3),
    repetitions: 3,
    easeFactor: 2.3,
    interval: 7,
    quality: 3,
  },

  // ── Data Visualization ────────────────────────────────────────────────────────
  {
    id: "dv-01",
    category: "Data Visualization",
    subcategory: "Chart Selection",
    front: "Which chart type should you use for which data?",
    back: "Comparison over time → Line chart\nComparison across categories → Bar chart\nPart-to-whole → Pie / stacked bar\nDistribution → Histogram, KDE, box plot\nCorrelation → Scatter plot, heatmap\nHigh-dimensional → PCA biplot, parallel coordinates, UMAP\nGeographic → Choropleth, dot map\n\nGolden rules:\n• Label axes and include units\n• Start y-axis at 0 for bar charts\n• Avoid 3-D charts (distort perception)\n• Use colour-blind-friendly palettes (viridis, cividis)",
    difficulty: "beginner",
    tags: ["visualisation", "chart-selection", "matplotlib", "seaborn"],
    created: daysAgo(9),
    lastReviewed: daysAgo(3),
    nextReview: daysAgo(-4),
    repetitions: 4,
    easeFactor: 2.6,
    interval: 8,
    quality: 4,
  },

  // ── SQL & Databases ───────────────────────────────────────────────────────────
  {
    id: "sql-01",
    category: "SQL & Databases",
    subcategory: "Joins",
    front: "What is the difference between INNER, LEFT, RIGHT, and FULL OUTER JOIN?",
    back: "INNER JOIN: returns rows that have matching keys in both tables.\nLEFT JOIN: all rows from left + matching from right; NULLs if no match.\nRIGHT JOIN: all rows from right + matching from left; NULLs if no match.\nFULL OUTER JOIN: all rows from both tables; NULLs where no match.\n\nMnemonic: think in terms of Venn diagrams. INNER = intersection, LEFT = left circle, FULL OUTER = union.",
    codeExample: `-- Find customers with and without orders
SELECT c.id, c.name, o.total
FROM   customers c
LEFT JOIN orders o ON c.id = o.customer_id
-- customers with no orders → o.total IS NULL

-- Only customers who ordered
SELECT c.name, SUM(o.total) AS revenue
FROM   customers c
INNER JOIN orders o ON c.id = o.customer_id
GROUP  BY c.name
ORDER  BY revenue DESC;`,
    difficulty: "beginner",
    tags: ["sql", "joins", "databases"],
    created: daysAgo(13),
    lastReviewed: daysAgo(5),
    nextReview: daysAgo(-2),
    repetitions: 5,
    easeFactor: 2.7,
    interval: 11,
    quality: 5,
  },

  // ── Feature Engineering ───────────────────────────────────────────────────────
  {
    id: "fe-01",
    category: "Feature Engineering",
    subcategory: "Encoding",
    front: "One-Hot Encoding vs Label Encoding — when to use each?",
    back: "Label Encoding assigns integers (0, 1, 2 …) to categories. Suitable for:\n• Ordinal categories with a natural order (e.g. low/medium/high)\n• Tree-based models (they can discover splits)\n\nOne-Hot Encoding creates a binary column per category. Suitable for:\n• Nominal categories with no order (e.g. city, colour)\n• Linear models and neural networks (avoids false ordinal signal)\n\nFor high-cardinality features (>100 categories), consider target encoding or embeddings instead.",
    codeExample: `import pandas as pd
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

df = pd.DataFrame({'colour': ['red','blue','green','red']})

# Label encoding (ordinal OK or tree-based model)
le = LabelEncoder()
df['colour_le'] = le.fit_transform(df['colour'])

# One-hot encoding (nominal + linear model)
dummies = pd.get_dummies(df['colour'], prefix='colour', drop_first=True)
df = pd.concat([df, dummies], axis=1)
print(df)`,
    difficulty: "beginner",
    tags: ["encoding", "one-hot", "label-encoding", "feature-engineering"],
    created: daysAgo(7),
    lastReviewed: daysAgo(1),
    nextReview: daysAgo(-7),
    repetitions: 6,
    easeFactor: 2.8,
    interval: 13,
    quality: 5,
  },

  // ── Model Evaluation ─────────────────────────────────────────────────────────
  {
    id: "me-01",
    category: "Model Evaluation",
    subcategory: "Classification Metrics",
    front: "Precision vs Recall — what do they measure and when does each matter?",
    back: "Precision = TP / (TP + FP)\n→ Of all predicted positives, how many are actually positive?\n→ Use when false positives are costly (e.g. spam filter, fraud alerts)\n\nRecall = TP / (TP + FN)\n→ Of all actual positives, how many did we catch?\n→ Use when false negatives are costly (e.g. disease detection, security)\n\nF1 Score = harmonic mean of Precision & Recall = 2·P·R / (P+R)\n→ Use when you need a single metric that balances both\n\nThere's always a tradeoff: increasing threshold → higher precision, lower recall.",
    difficulty: "beginner",
    tags: ["precision", "recall", "f1", "classification", "metrics"],
    created: daysAgo(16),
    lastReviewed: daysAgo(3),
    nextReview: daysAgo(-5),
    repetitions: 6,
    easeFactor: 2.6,
    interval: 10,
    quality: 4,
  },
  {
    id: "me-02",
    category: "Model Evaluation",
    subcategory: "Classification Metrics",
    front: "When to use ROC-AUC vs F1 score?",
    back: "ROC-AUC:\n• Measures discriminative ability across all thresholds\n• Threshold-independent — useful when you haven't chosen a decision threshold yet\n• Insensitive to class imbalance (can be misleading)\n• Use for: ranking models, comparing across datasets\n\nF1 Score:\n• Fixed-threshold metric (usually 0.5 default)\n• Sensitive to class imbalance — relevant for imbalanced datasets\n• Use for: when you have a specific operating point and need to balance precision/recall\n\nFor heavily imbalanced data, Precision-Recall AUC is often more informative than ROC-AUC.",
    codeExample: `from sklearn.metrics import roc_auc_score, f1_score
from sklearn.metrics import precision_recall_curve, auc

y_true  = [0, 0, 1, 1, 1]
y_score = [0.1, 0.4, 0.35, 0.8, 0.9]

roc_auc = roc_auc_score(y_true, y_score)
f1      = f1_score(y_true, [1 if s > 0.5 else 0 for s in y_score])

# PR-AUC for imbalanced data
precision, recall, _ = precision_recall_curve(y_true, y_score)
pr_auc = auc(recall, precision)

print(f'ROC-AUC={roc_auc:.3f}  F1={f1:.3f}  PR-AUC={pr_auc:.3f}')`,
    difficulty: "intermediate",
    tags: ["roc-auc", "f1", "pr-auc", "imbalanced", "metrics"],
    created: daysAgo(10),
    lastReviewed: daysAgo(2),
    nextReview: daysAgo(-6),
    repetitions: 4,
    easeFactor: 2.4,
    interval: 9,
    quality: 4,
  },

  // ── MLOps ─────────────────────────────────────────────────────────────────────
  {
    id: "ops-01",
    category: "MLOps",
    subcategory: "Deployment",
    front: "What is data drift and how do you detect it?",
    back: "Data drift (covariate shift): the statistical distribution of input features changes after model deployment.\n\nTypes:\n• Feature drift: P(X) changes\n• Label drift: P(y) changes\n• Concept drift: P(y|X) changes — most dangerous\n\nDetection methods:\n• Statistical tests: KS test, PSI (Population Stability Index), χ² test\n• Distance metrics: KL divergence, Wasserstein distance\n• Model-based: train a classifier to distinguish train vs production data\n\nMonitor in production with tools like Evidently AI, Alibi Detect, or WhyLabs.",
    difficulty: "advanced",
    tags: ["data-drift", "monitoring", "mlops", "production"],
    created: daysAgo(4),
    lastReviewed: daysAgo(0),
    nextReview: daysAgo(-1),
    repetitions: 2,
    easeFactor: 2.1,
    interval: 3,
    quality: 3,
  },
  {
    id: "ops-02",
    category: "MLOps",
    subcategory: "Experiment Tracking",
    front: "What should you track in an ML experiment?",
    back: "Every ML experiment should log:\n\nCode & Environment:\n• Git commit hash\n• Python / library versions\n• Hardware (GPU type, memory)\n\nData:\n• Dataset version / hash\n• Train/val/test split sizes\n• Preprocessing steps\n\nHyperparameters: all model & training params\n\nMetrics: train/val/test losses and task metrics at each epoch\n\nArtifacts: saved model weights, confusion matrix, feature importance plot\n\nTools: MLflow, Weights & Biases, Neptune, DVC",
    codeExample: `import mlflow

with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_param("n_estimators", 200)

    # ... train model ...

    mlflow.log_metric("val_accuracy", 0.923)
    mlflow.log_metric("val_f1", 0.891)
    mlflow.sklearn.log_model(model, "model")`,
    difficulty: "intermediate",
    tags: ["mlflow", "experiment-tracking", "mlops"],
    created: daysAgo(3),
    lastReviewed: undefined,
    nextReview: daysAgo(-0),
    repetitions: 0,
    easeFactor: 2.5,
    interval: 1,
    quality: undefined,
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

interface DeckState {
  cards: Flashcard[];
  streak: number;
  lastStudyDate: string | null;
  activeNav: string;

  addCard: (
    card: Omit<Flashcard, "id" | "created" | "repetitions" | "easeFactor" | "interval">
  ) => void;
  updateCard: (id: string, updates: Partial<Flashcard>) => void;
  deleteCard: (id: string) => void;
  recordReview: (id: string, quality: number) => void;
  setActiveNav: (nav: string) => void;
}

export const DS_CATEGORIES: DSCategory[] = [
  "Statistics",
  "Machine Learning",
  "Deep Learning",
  "Python & Libraries",
  "Data Wrangling",
  "Data Visualization",
  "SQL & Databases",
  "Feature Engineering",
  "Model Evaluation",
  "MLOps",
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
              created: new Date().toISOString(),
              repetitions: 0,
              easeFactor: 2.5,
              interval: 1,
            },
          ],
        })),

      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),

      recordReview: (id, quality) =>
        set((state) => {
          const today = new Date().toDateString();
          const lastStudy = state.lastStudyDate;
          const newStreak =
            lastStudy === today
              ? state.streak
              : lastStudy === new Date(Date.now() - 86400000).toDateString()
              ? state.streak + 1
              : 1;

          return {
            streak: newStreak,
            lastStudyDate: today,
            cards: state.cards.map((c) =>
              c.id === id ? { ...c, ...sm2(c, quality) } : c
            ),
          };
        }),

      setActiveNav: (nav) => set({ activeNav: nav }),
    }),
    { name: "dsdeck_cards" }
  )
);
