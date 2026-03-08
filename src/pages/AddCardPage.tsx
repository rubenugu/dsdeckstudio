import { useState, useRef, useEffect } from "react";
import { useDeckStore, DS_CATEGORIES, type DSCategory, type Difficulty } from "@/store/useDeckStore";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";
import { toast } from "@/hooks/use-toast";
import { CATEGORY_COLORS } from "@/pages/AllCardsPage";
import {
  Sparkles, X, Plus, Code, ChevronDown, AlertCircle,
  Eye, Tag, CheckCircle2,
} from "lucide-react";
import { SyntaxBlock } from "@/components/SyntaxBlock";

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFF_META: Record<Difficulty, { color: string }> = {
  beginner:     { color: "#3fb950" },
  intermediate: { color: "#d29922" },
  advanced:     { color: "#ff6e6e" },
};

const AI_SUGGESTIONS: Record<DSCategory, string[]> = {
  "Statistics": [
    "What is Bayes' Theorem and how is it applied?",
    "Explain confidence intervals and their interpretation",
    "What is the difference between correlation and causation?",
    "How does A/B testing work statistically?",
    "What is a sampling distribution?",
  ],
  "Machine Learning": [
    "How does gradient descent work?",
    "Explain k-fold cross-validation",
    "What is the difference between bagging and boosting?",
    "How do Support Vector Machines find the decision boundary?",
    "What is feature importance and how is it calculated?",
  ],
  "Deep Learning": [
    "What is the vanishing gradient problem?",
    "Explain the attention mechanism in transformers",
    "How does batch normalization work?",
    "What is transfer learning and when should you use it?",
    "Explain the difference between RNN, LSTM, and GRU",
  ],
  "Python & Libraries": [
    "How do Python decorators work?",
    "What are generator functions and when are they useful?",
    "Explain the difference between deep copy and shallow copy",
    "How does Python's GIL affect multithreading?",
    "What is the difference between map(), filter(), and reduce()?",
  ],
  "Data Wrangling": [
    "What are the strategies for handling missing data (MCAR, MAR, MNAR)?",
    "How do you detect and handle outliers?",
    "Explain the difference between wide and long data formats",
    "What is data normalization vs standardization?",
    "How do you merge and join DataFrames in pandas?",
  ],
  "Data Visualization": [
    "When should you use a box plot vs violin plot?",
    "How do you choose an effective color palette for data?",
    "What makes a good dashboard layout?",
    "When is a heatmap appropriate for data visualization?",
    "How do you visualize high-dimensional data?",
  ],
  "SQL & Databases": [
    "How do window functions work in SQL?",
    "What is the difference between HAVING and WHERE?",
    "Explain Common Table Expressions (CTEs)",
    "How does database indexing improve query performance?",
    "What is query optimization and how do you explain a query plan?",
  ],
  "Feature Engineering": [
    "How do you handle high-cardinality categorical features?",
    "What are lag features in time-series forecasting?",
    "How does SHAP explain feature importance?",
    "What is target encoding and when is it risky?",
    "How do polynomial features add non-linearity to linear models?",
  ],
  "Model Evaluation": [
    "How do you interpret a ROC-AUC curve?",
    "When should you use PR-AUC instead of ROC-AUC?",
    "What is model calibration and why does it matter?",
    "How do you evaluate a regression model?",
    "Explain the difference between validation set and test set",
  ],
  "MLOps": [
    "What is model drift and how do you detect it?",
    "How do feature stores work in ML pipelines?",
    "What are the best practices for ML experiment tracking?",
    "How do you version datasets and models with DVC?",
    "What is shadow deployment in A/B testing ML models?",
  ],
};

const FRONT_MAX = 300;
const BACK_MAX = 2000;

// ── Tag Input Component ───────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  function addTag(val: string) {
    const trimmed = val.trim().toLowerCase().replace(/\s+/g, "-");
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2.5 rounded-md min-h-[42px] transition-all duration-200"
      style={{
        background: "hsl(var(--surface))",
        border: "1px solid hsl(var(--border))",
      }}
      onClick={() => document.getElementById("tag-input")?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono"
          style={{
            background: "hsl(var(--primary) / 0.12)",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.25)",
          }}
        >
          #{tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
            style={{ color: "hsl(var(--primary))", opacity: 0.7 }}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        id="tag-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input) addTag(input); }}
        placeholder={tags.length === 0 ? "Type a tag and press Enter…" : ""}
        className="bg-transparent text-xs outline-none flex-1 min-w-24"
        style={{ color: "hsl(var(--foreground))" }}
      />
    </div>
  );
}

// ── Code Editor with Line Numbers ─────────────────────────────────────────────

function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  const lineCount = value ? value.split("\n").length : 1;

  function syncScroll() {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  // Auto-indent on Enter
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + "    " + value.substring(end);
      onChange(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; }, 0);
    }
  }

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))" }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: "#161b22",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <Code size={12} style={{ color: "#58a6ff" }} />
        <span className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          python · {lineCount} line{lineCount !== 1 ? "s" : ""}
        </span>
        <span
          className="ml-auto text-[10px] font-mono"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Tab=4sp
        </span>
      </div>

      <div className="flex" style={{ background: "#0d1117", maxHeight: 280, overflow: "hidden" }}>
        {/* Line numbers */}
        <div
          ref={lineNumRef}
          className="select-none overflow-hidden shrink-0"
          style={{
            color: "#3b4045",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "12px",
            lineHeight: "1.7",
            padding: "12px 8px 12px 12px",
            textAlign: "right",
            borderRight: "1px solid hsl(var(--border))",
            minWidth: "3rem",
            overflowY: "hidden",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          placeholder="# Paste or type a runnable Python snippet…
import pandas as pd

df = pd.read_csv('data.csv')
df.head()"
          rows={10}
          spellCheck={false}
          className="flex-1 outline-none resize-none bg-transparent"
          style={{
            color: "#d4d4d4",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "12px",
            lineHeight: "1.7",
            padding: "12px",
            overflowY: "auto",
          }}
        />
      </div>
    </div>
  );
}

// ── AI Suggest Dropdown ────────────────────────────────────────────────────────

function AISuggest({
  category,
  onSelect,
  lang,
}: {
  category: DSCategory;
  onSelect: (s: string) => void;
  lang: import("@/i18n/translations").Language;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap"
        style={{
          background: "hsl(212 100% 68% / 0.1)",
          color: "#58a6ff",
          border: "1px solid hsl(212 100% 68% / 0.25)",
        }}
      >
        <Sparkles size={12} />
        AI Suggest
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-30 rounded-lg overflow-hidden animate-fade-in"
          style={{
            background: "hsl(var(--surface))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 12px 32px hsl(0 0% 0% / 0.5)",
            minWidth: "340px",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          <div
            className="px-3 py-2 flex items-center gap-1.5"
            style={{ borderBottom: "1px solid hsl(var(--border))" }}
          >
            <Sparkles size={11} style={{ color: "#58a6ff" }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              {category} suggestions
            </span>
          </div>
          {AI_SUGGESTIONS[category].map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onSelect(s); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-xs transition-all duration-150 flex items-start gap-2"
              style={{ color: "hsl(var(--foreground))", borderBottom: i < 4 ? "1px solid hsl(var(--border))" : "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#21262d")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <span
                className="font-mono text-[10px] shrink-0 mt-0.5 w-4 text-center"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {i + 1}.
              </span>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card Preview ──────────────────────────────────────────────────────────────

function CardPreview({
  front,
  back,
  codeExample,
  category,
  difficulty,
  tags,
}: {
  front: string;
  back: string;
  codeExample: string;
  category: DSCategory;
  difficulty: Difficulty;
  tags: string[];
}) {
  const color = CATEGORY_COLORS[category];
  const diffMeta = DIFF_META[difficulty];
  const [flipped, setFlipped] = useState(false);

  const isEmpty = !front && !back;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Eye size={14} style={{ color: "hsl(var(--primary))" }} />
        <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          Live Preview
        </h2>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="ml-auto text-xs px-2.5 py-1 rounded-md transition-all duration-200"
            style={{
              background: "hsl(var(--surface-2))",
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            {flipped ? "Show front" : "Show back"}
          </button>
        )}
      </div>

      <div
        className="ds-card p-5 min-h-36 transition-all duration-200"
        style={isEmpty ? { opacity: 0.4 } : {}}
      >
        {isEmpty ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Fill in the form to see a preview
            </p>
          </div>
        ) : !flipped ? (
          <div className="space-y-3 animate-fade-in">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
              >
                {category}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: `${diffMeta.color}18`,
                  color: diffMeta.color,
                  border: `1px solid ${diffMeta.color}40`,
                }}
              >
                ● {difficulty}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Question
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
              {front || <span style={{ opacity: 0.4 }}>Your question will appear here…</span>}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))" }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Answer
            </p>
            {back ? (
              <div
                className="terminal-block p-3 text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {back}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
                Your answer will appear here…
              </p>
            )}
            {codeExample && (
              <div className="pt-1">
                <SyntaxBlock code={codeExample} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AddCardPage() {
  const { addCard } = useDeckStore();
  const { upsertCard } = useSupabaseSync();
  const { user } = useAuth();
  const { lang } = useLang();

  const DIFF_LABELS: Record<Difficulty, { label: string; desc: string }> = {
    beginner:     { label: t("difficulty_beginner", lang),     desc: t("difficulty_beginner_desc", lang) },
    intermediate: { label: t("difficulty_intermediate", lang), desc: t("difficulty_intermediate_desc", lang) },
    advanced:     { label: t("difficulty_advanced", lang),     desc: t("difficulty_advanced_desc", lang) },
  };

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [codeExample, setCodeExample] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [category, setCategory] = useState<DSCategory>("Machine Learning");
  const [subcategory, setSubcategory] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [tags, setTags] = useState<string[]>([]);

  // Validation
  const [touched, setTouched] = useState({ front: false, back: false });
  const errors = {
    front: touched.front && !front.trim() ? "Question is required" : front.length > FRONT_MAX ? `Max ${FRONT_MAX} characters` : "",
    back: touched.back && !back.trim() ? "Answer is required" : back.length > BACK_MAX ? `Max ${BACK_MAX} characters` : "",
  };
  const isValid = front.trim() && back.trim() && !errors.front && !errors.back;

  const labelStyle: React.CSSProperties = {
    color: "hsl(var(--muted-foreground))",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
    display: "block",
    marginBottom: "6px",
  };

  const inputBase: React.CSSProperties = {
    background: "hsl(var(--surface))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    borderRadius: "var(--radius)",
    fontSize: "13px",
    transition: "border-color 200ms ease",
    outline: "none",
    width: "100%",
    padding: "10px 12px",
  };

  const focus = (e: React.FocusEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary))");
  const blur = (e: React.FocusEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ front: true, back: true });
    if (!isValid) return;

    const newCard = addCard({
      front: front.trim(),
      back: back.trim(),
      codeExample: codeExample.trim() || undefined,
      category,
      subcategory: subcategory.trim() || category,
      difficulty,
      tags,
    });

    // Sync to Supabase if logged in
    if (user) upsertCard(newCard);

    toast({
      title: t("add_success", lang),
      description: `"${front.slice(0, 50)}${front.length > 50 ? "…" : ""}" is ready for review`,
    });

    // Reset
    setFront("");
    setBack("");
    setCodeExample("");
    setSubcategory("");
    setTags([]);
    setShowCode(false);
    setTouched({ front: false, back: false });
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {t("add_title", lang)}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("add_header_sub", lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">

            {/* Category */}
            <div>
              <label style={labelStyle}>{t("add_category", lang)}</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DSCategory)}
                  style={{ ...inputBase, paddingLeft: "36px", cursor: "pointer", appearance: "none" }}
                  onFocus={focus}
                  onBlur={blur}
                >
                  {DS_CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: "#161b22" }}>
                      {c}
                    </option>
                  ))}
                </select>
                {/* Colour dot overlay */}
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
                  style={{ background: CATEGORY_COLORS[category] }}
                />
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                />
              </div>
            </div>

            {/* Subcategory */}
            <div>
              <label style={labelStyle}>{t("add_subcategory", lang)}</label>
              <input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder={t("add_subcategory_placeholder", lang)}
                maxLength={80}
                style={inputBase}
                onFocus={focus}
                onBlur={blur}
              />
            </div>

            {/* Difficulty — segmented control */}
            <div>
              <label style={labelStyle}>{t("add_difficulty", lang)}</label>
              <div
                className="grid grid-cols-3 p-1 rounded-lg gap-1"
                style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}
              >
                {(Object.entries(DIFF_META) as [Difficulty, typeof DIFF_META[Difficulty]][]).map(
                  ([key, meta]) => {
                    const labels = DIFF_LABELS[key];
                    return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDifficulty(key)}
                      className="flex flex-col items-center py-2 px-1 rounded-md transition-all duration-200"
                      style={
                        difficulty === key
                          ? {
                              background: `${meta.color}18`,
                              border: `1px solid ${meta.color}50`,
                              color: meta.color,
                            }
                          : {
                              color: "hsl(var(--muted-foreground))",
                              border: "1px solid transparent",
                            }
                      }
                    >
                      <span className="text-xs font-semibold">{labels.label}</span>
                      <span className="text-[10px] mt-0.5 opacity-70">{labels.desc}</span>
                    </button>
                  );
                  }
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={labelStyle}>
                <span className="flex items-center gap-1.5">
                  <Tag size={10} />
                  {t("add_tags", lang)}
                  <span style={{ fontWeight: 400, textTransform: "none" }}>
                    {t("add_tags_hint", lang)}
                  </span>
                </span>
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            {/* Front */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  {t("add_front", lang)}
                  <span style={{ color: "#ff6e6e", marginLeft: 2 }}>*</span>
                </label>
                <div className="flex items-center gap-2">
                  <AISuggest category={category} onSelect={(s) => setFront(s)} />
                </div>
              </div>
              <textarea
                rows={3}
                value={front}
                maxLength={FRONT_MAX + 10}
                onChange={(e) => setFront(e.target.value)}
                onBlur={(e) => { setTouched((t) => ({ ...t, front: true })); blur(e); }}
                onFocus={focus}
                placeholder={t("add_front_placeholder", lang)}
                style={{
                  ...inputBase,
                  resize: "vertical",
                  fontFamily: "inherit",
                  borderColor: errors.front ? "#ff6e6e" : undefined,
                }}
              />
              <div className="flex justify-between mt-1">
                {errors.front ? (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "#ff6e6e" }}>
                    <AlertCircle size={11} /> {errors.front}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className="text-[10px] font-mono"
                  style={{ color: front.length > FRONT_MAX * 0.85 ? "#d29922" : "hsl(var(--muted-foreground))" }}
                >
                  {front.length}/{FRONT_MAX}
                </span>
              </div>
            </div>

            {/* Back */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  {t("add_back", lang)}
                  <span style={{ color: "#ff6e6e", marginLeft: 2 }}>*</span>
                </label>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))" }}
                >
                  markdown hints OK
                </span>
              </div>
              <textarea
                rows={6}
                value={back}
                maxLength={BACK_MAX + 20}
                onChange={(e) => setBack(e.target.value)}
                onBlur={(e) => { setTouched((t) => ({ ...t, back: true })); blur(e); }}
                onFocus={focus}
                placeholder={t("add_back_placeholder", lang)}
                style={{
                  ...inputBase,
                  resize: "vertical",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  borderColor: errors.back ? "#ff6e6e" : undefined,
                }}
              />
              <div className="flex justify-between mt-1">
                {errors.back ? (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "#ff6e6e" }}>
                    <AlertCircle size={11} /> {errors.back}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className="text-[10px] font-mono"
                  style={{ color: back.length > BACK_MAX * 0.85 ? "#d29922" : "hsl(var(--muted-foreground))" }}
                >
                  {back.length}/{BACK_MAX}
                </span>
              </div>
            </div>

            {/* Code Example */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  {t("add_code", lang)}
                  <span
                    className="ml-2 font-mono"
                    style={{ fontWeight: 400, textTransform: "none", color: "hsl(var(--muted-foreground))" }}
                  >
                    {t("add_code_optional", lang)}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowCode((s) => !s); if (showCode) setCodeExample(""); }}
                  className="flex items-center gap-1.5 text-xs transition-all duration-200"
                  style={{ color: showCode ? "#ff6e6e" : "#58a6ff" }}
                >
                  {showCode
                    ? <><X size={12} /> {t("add_code_remove", lang)}</>
                    : <><Plus size={12} /> {t("add_code_add", lang)}</>}
                </button>
              </div>
              {showCode && <CodeEditor value={codeExample} onChange={setCodeExample} />}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isValid ? "hsl(var(--primary) / 0.15)" : "hsl(var(--surface-2))",
                color: isValid ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${isValid ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
              }}
            >
              <CheckCircle2 size={16} />
              {t("add_submit", lang)}
            </button>
          </form>

          {/* ── Live Preview ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <CardPreview
                front={front}
                back={back}
                codeExample={codeExample}
                category={category}
                difficulty={difficulty}
                tags={tags}
              />

              {/* Deck stats hint */}
              <div
                className="mt-4 p-3 rounded-lg text-xs space-y-1"
                style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              >
                <p className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  {t("add_sm2_defaults", lang)}
                </p>
                {([
                  [t("add_sm2_ease", lang),     "2.50"],
                  [t("add_sm2_interval", lang),  t("add_sm2_interval_val", lang)],
                  [t("add_sm2_reps", lang),      "0"],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{k}</span>
                    <span className="font-mono" style={{ color: "hsl(var(--primary))" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
