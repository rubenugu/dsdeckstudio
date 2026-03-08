import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Zap, ChevronRight, RotateCcw, LayoutDashboard,
  Clock, CheckCircle2, XCircle, Trophy, Target, Flame,
} from "lucide-react";
import { useDeckStore, type Flashcard, type DSCategory, type Difficulty, DS_CATEGORIES } from "@/store/useDeckStore";
import { useLang } from "@/contexts/LanguageContext";
import { t, type Language } from "@/i18n/translations";

// ── Category / diff colours ────────────────────────────────────────────────────
const CAT_COLORS: Record<DSCategory, string> = {
  "Statistics":          "#a371f7",
  "Machine Learning":    "#58a6ff",
  "Deep Learning":       "#39d353",
  "Python & Libraries":  "#d29922",
  "Data Wrangling":      "#f78166",
  "Data Visualization":  "#ff7eb6",
  "SQL & Databases":     "#56d364",
  "Feature Engineering": "#818cf8",
  "Model Evaluation":    "#ff6e6e",
  "MLOps":               "#3fb950",
};

const DIFF_COLORS: Record<Difficulty, string> = {
  beginner:     "#3fb950",
  intermediate: "#d29922",
  advanced:     "#ff6e6e",
};

const QUESTION_COUNTS = [5, 10, 20] as const;
const TIMER_SECS = 30;

// ── Types ─────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  card: Flashcard;
  choices: string[];   // 4 answers, shuffled
  correct: string;     // correct answer text (card.back snippet)
}

interface QuizResult {
  question: QuizQuestion;
  chosen: string | null;   // null = timed out
  correct: boolean;
  timeTaken: number;       // seconds
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Trim back text to a readable length for MCQ answers */
function trimAnswer(text: string, maxLen = 90) {
  const first = text.split("\n")[0].trim();
  return first.length > maxLen ? first.slice(0, maxLen) + "…" : first;
}

function buildChoices(card: Flashcard, allCards: Flashcard[]): string[] {
  const correct = trimAnswer(card.back);
  // Distractors: prefer same category, else random
  const pool = allCards
    .filter((c) => c.id !== card.id)
    .sort(() => Math.random() - 0.5);

  const sameCat = pool.filter((c) => c.category === card.category);
  const other   = pool.filter((c) => c.category !== card.category);
  const ordered = [...sameCat, ...other];

  const distractors: string[] = [];
  for (const c of ordered) {
    if (distractors.length >= 3) break;
    const t = trimAnswer(c.back);
    if (t !== correct && !distractors.includes(t)) distractors.push(t);
  }
  // Pad if not enough
  while (distractors.length < 3) distractors.push(`None of the above (option ${distractors.length + 1})`);

  return shuffle([correct, ...distractors]);
}

function buildQuiz(
  cards: Flashcard[],
  cat: DSCategory | "all",
  diff: Difficulty | "all",
  count: number | "all"
): QuizQuestion[] {
  let pool = [...cards];
  if (cat !== "all")  pool = pool.filter((c) => c.category  === cat);
  if (diff !== "all") pool = pool.filter((c) => c.difficulty === diff);
  pool = shuffle(pool);
  const limited = count === "all" ? pool : pool.slice(0, count);
  return limited.map((card) => ({
    card,
    choices: buildChoices(card, cards),
    correct: trimAnswer(card.back),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 1 — Setup
// ─────────────────────────────────────────────────────────────────────────────
interface SetupProps {
  cards: Flashcard[];
  lang: Language;
  onStart: (questions: QuizQuestion[]) => void;
  onGoToDashboard: () => void;
}

function QuizSetup({ cards, lang, onStart, onGoToDashboard }: SetupProps) {
  const [cat,   setCat]   = useState<DSCategory | "all">("all");
  const [diff,  setDiff]  = useState<Difficulty | "all">("all");
  const [count, setCount] = useState<number | "all">(10);

  const available = useMemo(() => {
    let p = [...cards];
    if (cat  !== "all") p = p.filter((c) => c.category  === cat);
    if (diff !== "all") p = p.filter((c) => c.difficulty === diff);
    return p.length;
  }, [cards, cat, diff]);

  const effectiveCount = count === "all" ? available : Math.min(count, available);
  const canStart = effectiveCount >= 2; // need at least 2 cards to make choices

  function handleStart() {
    if (!canStart) return;
    const questions = buildQuiz(cards, cat, diff, count);
    onStart(questions);
  }

  const categories = DS_CATEGORIES;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "hsl(var(--warning) / 0.12)", border: "1px solid hsl(var(--warning) / 0.3)" }}
          >
            <Zap size={26} style={{ color: "hsl(var(--warning))" }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Quick Quiz
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Multiple-choice · 30 s per question · instant scoring
          </p>
        </div>

        <div className="ds-card p-5 space-y-5">
          {/* Category */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Category
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCat("all")}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: cat === "all" ? "hsl(var(--primary) / 0.15)" : "hsl(var(--surface-2))",
                  border:     cat === "all" ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
                  color:      cat === "all" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                All
              </button>
              {categories.map((c) => {
                const color  = CAT_COLORS[c];
                const active = cat === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: active ? `${color}18` : "hsl(var(--surface-2))",
                      border:     active ? `1px solid ${color}55` : "1px solid hsl(var(--border))",
                      color:      active ? color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {c.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Difficulty
            </p>
            <div className="flex gap-2">
              {(["all", "beginner", "intermediate", "advanced"] as const).map((d) => {
                const active = diff === d;
                const color  = d === "all" ? "hsl(var(--primary))" : DIFF_COLORS[d as Difficulty];
                return (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                    style={{
                      background: active ? `${color}18` : "hsl(var(--surface-2))",
                      border:     active ? `1px solid ${color}55` : "1px solid hsl(var(--border))",
                      color:      active ? color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {d === "all" ? "All" : d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question count */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Questions
            </p>
            <div className="flex gap-2">
              {([5, 10, 20, "all"] as const).map((n) => {
                const active = count === n;
                const label  = n === "all" ? `All (${available})` : `${n}`;
                return (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold font-mono transition-all"
                    style={{
                      background: active ? "hsl(var(--primary) / 0.15)" : "hsl(var(--surface-2))",
                      border:     active ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
                      color:      active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available preview */}
          <div
            className="flex items-center justify-between p-3 rounded-lg text-xs"
            style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}
          >
            <span style={{ color: "hsl(var(--muted-foreground))" }}>Quiz size</span>
            <span className="font-mono font-semibold" style={{ color: canStart ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
              {canStart ? `${effectiveCount} questions` : "Not enough cards — change filters"}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          >
            <LayoutDashboard size={14} />
            Back
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: canStart ? "hsl(var(--warning))" : "hsl(var(--surface-2))",
              color:      canStart ? "hsl(215 14% 8%)" : "hsl(var(--muted-foreground))",
              border:     canStart ? "none" : "1px solid hsl(var(--border))",
              cursor:     canStart ? "pointer" : "not-allowed",
              opacity:    canStart ? 1 : 0.6,
            }}
          >
            <Zap size={15} />
            Start Quiz
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 2 — Question
// ─────────────────────────────────────────────────────────────────────────────
interface QuestionProps {
  questions: QuizQuestion[];
  lang: Language;
  onComplete: (results: QuizResult[]) => void;
}

function QuizQuestion({ questions, lang, onComplete }: QuestionProps) {
  const [index,    setIndex]    = useState(0);
  const [chosen,   setChosen]   = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS);
  const [results,  setResults]  = useState<QuizResult[]>([]);
  const questionStart = useRef(Date.now());

  const q = questions[index];
  const catColor  = CAT_COLORS[q.card.category] ?? "#58a6ff";
  const diffColor = DIFF_COLORS[q.card.difficulty];
  const timerPct  = (timeLeft / TIMER_SECS) * 100;
  const timerColor =
    timeLeft > 15 ? "hsl(var(--success))" :
    timeLeft > 7  ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  // Countdown timer
  useEffect(() => {
    if (revealed) return;
    if (timeLeft <= 0) {
      handleAnswer(null); // timed out
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, revealed]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(TIMER_SECS);
    setChosen(null);
    setRevealed(false);
    questionStart.current = Date.now();
  }, [index]);

  function handleAnswer(answer: string | null) {
    if (revealed) return;
    setChosen(answer);
    setRevealed(true);
  }

  function advance() {
    const timeTaken = Math.round((Date.now() - questionStart.current) / 1000);
    const newResult: QuizResult = {
      question: q,
      chosen,
      correct: chosen === q.correct,
      timeTaken,
    };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (index + 1 >= questions.length) {
      onComplete(newResults);
    } else {
      setIndex((i) => i + 1);
    }
  }

  // Keyboard: 1–4 choose, Space/Enter advance after reveal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (revealed) advance();
      }
      if (!revealed && ["1","2","3","4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (q.choices[idx]) handleAnswer(q.choices[idx]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, index, results]);

  return (
    <div className="flex flex-col items-center gap-5 p-5 md:p-7 min-h-full">
      {/* Progress */}
      <div className="w-full max-w-2xl space-y-2">
        <div className="flex items-center justify-between text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>
            Question <span className="font-mono font-semibold" style={{ color: "hsl(var(--foreground))" }}>{index + 1}</span>
            {" / "}
            <span className="font-mono font-semibold" style={{ color: "hsl(var(--foreground))" }}>{questions.length}</span>
          </span>
          <span className="flex items-center gap-1.5" style={{ color: timerColor }}>
            <Clock size={12} />
            <span className="font-mono font-semibold">{timeLeft}s</span>
          </span>
        </div>

        {/* Quiz progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-2))" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((index) / questions.length) * 100}%`, background: "hsl(var(--primary))" }}
          />
        </div>

        {/* Timer bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-2))" }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        className="w-full max-w-2xl ds-card p-6 space-y-4"
        style={{ borderColor: revealed ? (chosen === q.correct ? "#3fb95040" : "#f8514940") : "hsl(var(--border))" }}
      >
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}40` }}
          >
            {q.card.category}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium"
            style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40` }}
          >
            {q.card.difficulty}
          </span>
          {q.card.subcategory && (
            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {q.card.subcategory}
            </span>
          )}
        </div>

        {/* Question text */}
        <p className="text-lg font-medium leading-snug" style={{ color: "hsl(var(--foreground))" }}>
          {q.card.front}
        </p>

        {/* Tags */}
        {q.card.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {q.card.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Choices */}
      <div className="w-full max-w-2xl grid grid-cols-1 gap-2">
        {q.choices.map((choice, ci) => {
          const isCorrect  = choice === q.correct;
          const isChosen   = choice === chosen;
          const isTimeout  = revealed && chosen === null;

          let bg     = "hsl(var(--surface))";
          let border = "hsl(var(--border))";
          let color  = "hsl(var(--foreground))";
          let icon: React.ReactNode = null;

          if (revealed) {
            if (isCorrect) {
              bg = "#3fb95018"; border = "#3fb95060"; color = "#3fb950";
              icon = <CheckCircle2 size={15} style={{ color: "#3fb950", flexShrink: 0 }} />;
            } else if (isChosen && !isCorrect) {
              bg = "#f8514918"; border = "#f8514960"; color = "#f85149";
              icon = <XCircle size={15} style={{ color: "#f85149", flexShrink: 0 }} />;
            } else if (isTimeout && !isCorrect) {
              color = "hsl(var(--muted-foreground))";
            }
          }

          return (
            <button
              key={ci}
              onClick={() => !revealed && handleAnswer(choice)}
              disabled={revealed}
              className="flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150"
              style={{ background: bg, border: `1px solid ${border}`, color, cursor: revealed ? "default" : "pointer" }}
              onMouseEnter={(e) => {
                if (!revealed) (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--primary) / 0.5)";
              }}
              onMouseLeave={(e) => {
                if (!revealed) (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border))";
              }}
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5"
                style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                {ci + 1}
              </span>
              {icon}
              <span className="flex-1 leading-snug">{choice}</span>
            </button>
          );
        })}
      </div>

      {/* Timed out message */}
      {revealed && chosen === null && (
        <div
          className="w-full max-w-2xl flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: "hsl(var(--destructive) / 0.1)", border: "1px solid hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}
        >
          <Clock size={14} />
          Time's up! The correct answer is highlighted above.
        </div>
      )}

      {/* Next button (after reveal) */}
      {revealed && (
        <button
          onClick={advance}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: "hsl(var(--warning))", color: "hsl(215 14% 8%)" }}
        >
          {index + 1 >= questions.length ? "See Results" : "Next Question"}
          <ChevronRight size={15} />
        </button>
      )}

      {/* Keyboard hint */}
      {!revealed && (
        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          Press{" "}
          {[1,2,3,4].map((n) => (
            <kbd key={n} className="mx-0.5 px-1.5 py-0.5 rounded font-mono" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>
              {n}
            </kbd>
          ))}
          {" "}to choose
        </p>
      )}
      {revealed && (
        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>
            Space
          </kbd>
          {" "}to continue
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 3 — Results
// ─────────────────────────────────────────────────────────────────────────────
interface ResultsProps {
  results: QuizResult[];
  onRetry: () => void;
  onDashboard: () => void;
}

function QuizResults({ results, onRetry, onDashboard }: ResultsProps) {
  const total    = results.length;
  const correct  = results.filter((r) => r.correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalTime = results.reduce((s, r) => s + r.timeTaken, 0);
  const avgTime   = total > 0 ? (totalTime / total).toFixed(1) : "0";

  const wrong = results.filter((r) => !r.correct);

  const grade =
    accuracy >= 90 ? { emoji: "🏆", label: "Outstanding!", color: "#39d353" } :
    accuracy >= 70 ? { emoji: "🎯", label: "Great job!", color: "#3fb950" } :
    accuracy >= 50 ? { emoji: "💪", label: "Good effort!", color: "#d29922" } :
    { emoji: "📖", label: "Keep studying!", color: "#f85149" };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="w-full max-w-xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">{grade.emoji}</div>
          <h2 className="text-2xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>{grade.label}</h2>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {accuracy >= 70 ? "You're ready for that interview!" : "Review the missed topics and try again."}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Target,       label: "Score",    value: `${correct}/${total}`, color: grade.color },
            { icon: Trophy,       label: "Accuracy", value: `${accuracy}%`,        color: grade.color },
            { icon: Clock,        label: "Avg time", value: `${avgTime}s`,         color: "hsl(var(--primary))" },
            { icon: Flame,        label: "Streak",   value: wrong.length === 0 ? "Perfect" : `${total - wrong.length}`,  color: "#f78166" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="ds-card p-3 text-center space-y-1">
              <Icon size={16} className="mx-auto" style={{ color }} />
              <p className="font-mono text-lg font-bold leading-tight" style={{ color }}>{value}</p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Score ring visual */}
        <div className="ds-card p-5">
          <div className="flex items-center gap-4">
            {/* SVG ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--surface-2))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={grade.color}
                  strokeWidth="3"
                  strokeDasharray={`${accuracy} 100`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono font-bold text-sm" style={{ color: grade.color }}>{accuracy}%</span>
              </div>
            </div>
            {/* Breakdown bars */}
            <div className="flex-1 space-y-2">
              {[
                { label: "Correct",  count: correct,         color: "#3fb950" },
                { label: "Wrong",    count: wrong.length,     color: "#f85149" },
                { label: "Timed out",count: results.filter(r => r.chosen === null).length, color: "#d29922" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-2))" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, background: color }}
                    />
                  </div>
                  <span className="w-4 text-right font-mono" style={{ color }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wrong answers review */}
        {wrong.length > 0 && (
          <div className="ds-card p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Missed Questions ({wrong.length})
            </p>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {wrong.map((r, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg space-y-1.5"
                  style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}
                >
                  <p className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {r.question.card.front}
                  </p>
                  <div className="flex items-start gap-2 text-[11px]">
                    <XCircle size={12} style={{ color: "#f85149", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: "#f85149" }}>
                      {r.chosen ?? "Timed out"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px]">
                    <CheckCircle2 size={12} style={{ color: "#3fb950", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: "#3fb950" }}>{r.question.correct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <button
            onClick={onDashboard}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </button>
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "hsl(var(--warning))", color: "hsl(215 14% 8%)" }}
          >
            <RotateCcw size={14} />
            Quiz Again
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root orchestrator
// ─────────────────────────────────────────────────────────────────────────────
type Screen = "setup" | "quiz" | "results";

export function QuickQuizPage() {
  const { cards, setActiveNav } = useDeckStore();
  const [screen,    setScreen]    = useState<Screen>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [results,   setResults]   = useState<QuizResult[]>([]);

  if (cards.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
        <Zap size={40} style={{ color: "hsl(var(--warning))", opacity: 0.6 }} />
        <p className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>Not enough cards</p>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          You need at least 4 cards to run a quiz (for answer choices).
        </p>
        <button
          onClick={() => setActiveNav("add-card")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
        >
          Add cards
        </button>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <QuizSetup
        cards={cards}
        onStart={(qs) => { setQuestions(qs); setScreen("quiz"); }}
        onGoToDashboard={() => setActiveNav("dashboard")}
      />
    );
  }

  if (screen === "quiz") {
    return (
      <QuizQuestion
        questions={questions}
        onComplete={(r) => { setResults(r); setScreen("results"); }}
      />
    );
  }

  return (
    <QuizResults
      results={results}
      onRetry={() => setScreen("setup")}
      onDashboard={() => setActiveNav("dashboard")}
    />
  );
}
