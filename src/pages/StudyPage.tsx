import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, ChevronRight, RotateCcw, LayoutDashboard,
  SkipForward, Pencil, Flame, Clock, Target, BarChart2,
  Zap, Brain, CheckCircle2, XCircle, Minus,
} from "lucide-react";
import { useDeckStore, DSCategory, Flashcard } from "@/store/useDeckStore";
import { getDueCards } from "@/utils/sm2";
import { SyntaxBlock } from "@/components/SyntaxBlock";

// ── Category colours (same as AllCardsPage) ──────────────────────────────────
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

const DIFF_COLORS: Record<string, string> = {
  beginner:     "hsl(var(--success))",
  intermediate: "hsl(var(--warning))",
  advanced:     "hsl(var(--destructive))",
};

// ── Rating definitions ────────────────────────────────────────────────────────
const RATINGS = [
  { quality: 0, emoji: "🔴", label: "Blackout",  sub: "No idea",           key: "1", color: "#f85149" },
  { quality: 2, emoji: "🟠", label: "Hard",       sub: "Barely recalled",   key: "2", color: "#d29922" },
  { quality: 3, emoji: "🟡", label: "Good",       sub: "Got it with effort", key: "3", color: "#3fb950" },
  { quality: 5, emoji: "🟢", label: "Easy",       sub: "Perfect recall",    key: "4", color: "#39d353" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso));
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 1: Session Setup
// ─────────────────────────────────────────────────────────────────────────────
type StudyMode = "due" | "all" | DSCategory;

interface SetupProps {
  cards: Flashcard[];
  onStart: (queue: Flashcard[]) => void;
  onGoToDashboard: () => void;
}

function SessionSetup({ cards, onStart, onGoToDashboard }: SetupProps) {
  const dueCards = getDueCards(cards);
  const [mode, setMode] = useState<StudyMode>(dueCards.length > 0 ? "due" : "all");

  const categories = Array.from(new Set(cards.map((c) => c.category))) as DSCategory[];

  function buildQueue(): Flashcard[] {
    let pool: Flashcard[] = [];
    if (mode === "due")      pool = getDueCards(cards);
    else if (mode === "all") pool = [...cards];
    else                     pool = cards.filter((c) => c.category === mode);
    return pool.sort(() => Math.random() - 0.5);
  }

  function modeCount(m: StudyMode) {
    if (m === "due") return getDueCards(cards).length;
    if (m === "all") return cards.length;
    return cards.filter((c) => c.category === m).length;
  }

  const queue = buildQueue();

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 animate-fade-in">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="p-3 rounded-xl"
              style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.25)" }}
            >
              <BookOpen size={22} style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Start a Study Session
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {dueCards.length > 0
              ? `You have ${dueCards.length} card${dueCards.length !== 1 ? "s" : ""} due for review`
              : "No cards due today — study ahead!"}
          </p>
        </div>

        {/* Mode picker */}
        <div className="ds-card p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
            What to study
          </p>

          {/* Due / All rows */}
          {(["due", "all"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-150"
              style={{
                background: mode === m ? "hsl(var(--primary) / 0.12)" : "hsl(var(--surface-2))",
                border: `1px solid ${mode === m ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}`,
                color: mode === m ? "hsl(var(--primary))" : "hsl(var(--foreground))",
              }}
            >
              <span className="font-medium">
                {m === "due" ? "⏰  Due cards only" : "📚  All cards"}
              </span>
              <span
                className="font-mono text-xs px-2 py-0.5 rounded"
                style={{
                  background: mode === m ? "hsl(var(--primary) / 0.18)" : "hsl(var(--border) / 0.5)",
                  color: mode === m ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                {modeCount(m)}
              </span>
            </button>
          ))}

          {/* Category divider */}
          <p className="text-[10px] uppercase tracking-widest pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            By category
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {categories.map((cat) => {
              const color = CAT_COLORS[cat];
              const active = mode === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setMode(cat)}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all duration-150"
                  style={{
                    background: active ? `${color}18` : "hsl(var(--surface-2))",
                    border: `1px solid ${active ? `${color}60` : "hsl(var(--border))"}`,
                    color: active ? color : "hsl(var(--muted-foreground))",
                  }}
                >
                  <span className="truncate font-medium">{cat}</span>
                  <span className="font-mono ml-1 shrink-0">{modeCount(cat)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary + Start */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: "hsl(var(--surface-2))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </button>

          <button
            onClick={() => queue.length > 0 && onStart(queue)}
            disabled={queue.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: queue.length === 0 ? "hsl(var(--surface-2))" : "hsl(var(--primary))",
              color: queue.length === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
              border: queue.length === 0 ? "1px solid hsl(var(--border))" : "none",
              cursor: queue.length === 0 ? "not-allowed" : "pointer",
              opacity: queue.length === 0 ? 0.6 : 1,
            }}
          >
            Start Session
            <ChevronRight size={15} />
            <span
              className="font-mono text-xs ml-0.5 px-1.5 py-0.5 rounded"
              style={{ background: "hsl(0 0% 0% / 0.2)" }}
            >
              {queue.length}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 2: Card Review
// ─────────────────────────────────────────────────────────────────────────────
interface ReviewResult { cardId: string; quality: number; }

interface ReviewProps {
  queue: Flashcard[];
  onComplete: (results: ReviewResult[], elapsedSeconds: number) => void;
  onEditCard: (id: string) => void;
}

function CardReview({ queue, onComplete, onEditCard }: ReviewProps) {
  const { recordReview } = useDeckStore();
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [results, setResults]   = useState<ReviewResult[]>([]);
  const [exiting, setExiting]   = useState(false);
  const startTime               = useRef(Date.now());

  const card = queue[index];

  const flip = useCallback(() => setFlipped((f) => !f), []);

  function handleRate(quality: number) {
    recordReview(card.id, quality);
    const newResults = [...results, { cardId: card.id, quality }];
    setResults(newResults);

    setExiting(true);
    setTimeout(() => {
      if (index + 1 >= queue.length) {
        const elapsed = Math.round((Date.now() - startTime.current) / 1000);
        onComplete(newResults, elapsed);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
        setExiting(false);
      }
    }, 220);
  }

  function handleSkip() {
    setExiting(true);
    setTimeout(() => {
      if (index + 1 >= queue.length) {
        const elapsed = Math.round((Date.now() - startTime.current) / 1000);
        onComplete(results, elapsed);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
        setExiting(false);
      }
    }, 220);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      if (e.code === "Space") { e.preventDefault(); flip(); }
      if (flipped) {
        if (e.key === "1") handleRate(0);
        if (e.key === "2") handleRate(2);
        if (e.key === "3") handleRate(3);
        if (e.key === "4") handleRate(5);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, flip, index]);

  const progress = ((index) / queue.length) * 100;
  const catColor = CAT_COLORS[card.category] ?? "hsl(var(--primary))";
  const diffColor = DIFF_COLORS[card.difficulty];

  return (
    <div className="flex flex-col items-center gap-5 p-6 min-h-full animate-fade-in">

      {/* ── Progress bar ── */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>
            Card <span className="font-mono font-semibold" style={{ color: "hsl(var(--foreground))" }}>{index + 1}</span>
            {" "}of{" "}
            <span className="font-mono font-semibold" style={{ color: "hsl(var(--foreground))" }}>{queue.length}</span>
          </span>
          <span className="font-mono">{Math.round(progress)}% done</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-2))" }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: "hsl(var(--primary))" }}
          />
        </div>

        {/* mini results row */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {results.map((r, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: RATINGS.find(rt => rt.quality === r.quality)?.color ?? "#8b949e" }}
              title={RATINGS.find(rt => rt.quality === r.quality)?.label}
            />
          ))}
        </div>
      </div>

      {/* ── Flip card ── */}
      <div
        className="w-full max-w-2xl"
        style={{ perspective: "1200px", minHeight: 340 }}
      >
        <div
          onClick={flip}
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            cursor: "pointer",
            minHeight: 340,
          }}
        >
          {/* FRONT */}
          <div
            className="ds-card flip-face absolute inset-0 p-6 flex flex-col gap-4"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] px-2.5 py-1 rounded-md font-semibold"
                style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}40` }}
              >
                {card.category}
              </span>
              {card.subcategory && card.subcategory !== card.category && (
                <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {card.subcategory}
                </span>
              )}
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ml-auto"
                style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40` }}
              >
                {card.difficulty}
              </span>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center py-4">
              <p
                className="text-xl font-medium text-center leading-relaxed"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {card.front}
              </p>
            </div>

            {/* Tags */}
            {card.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {card.tags.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Hint */}
            <div className="text-center">
              <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Click card or press <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>Space</kbd> to reveal answer
              </span>
            </div>
          </div>

          {/* BACK */}
          <div
            className="ds-card flip-face absolute inset-0 p-6 flex flex-col gap-4 overflow-y-auto"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "hsl(var(--surface))",
              borderColor: `${catColor}50`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Answer label */}
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
              Answer
            </p>

            {/* Back text */}
            <div
              className="terminal-block p-4 text-sm leading-relaxed whitespace-pre-wrap flex-1"
              style={{ color: "hsl(var(--foreground))", maxHeight: card.codeExample ? 180 : 340, overflowY: "auto" }}
            >
              {card.back}
            </div>

            {/* Code */}
            {card.codeExample && (
              <SyntaxBlock code={card.codeExample} language="python" />
            )}

            {/* SM-2 stats mini row */}
            {card.repetitions > 0 && (
              <div className="flex gap-4 text-[10px] font-mono pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span>rep #{card.repetitions}</span>
                <span>EF {card.easeFactor.toFixed(2)}</span>
                <span>every {card.interval}d</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Rating buttons (only after flip) ── */}
      {flipped && (
        <div className="w-full max-w-2xl animate-fade-in">
          <p className="text-[10px] uppercase tracking-widest mb-3 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
            How well did you know this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map(({ quality, emoji, label, sub, key, color }) => (
              <button
                key={quality}
                onClick={() => handleRate(quality)}
                className="flex flex-col items-center py-3 px-2 rounded-lg text-center transition-all duration-150 group"
                style={{
                  background: `${color}12`,
                  border: `1px solid ${color}40`,
                  color,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}28`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}12`; }}
              >
                <span className="text-xl mb-1">{emoji}</span>
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-[10px] leading-tight opacity-75">{sub}</span>
                <span
                  className="mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${color}20`, opacity: 0.8 }}
                >
                  [{key}]
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Floating actions ── */}
      <div
        className="w-full max-w-2xl flex items-center justify-between text-xs"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <button
          onClick={() => onEditCard(card.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150"
          style={{ border: "1px solid hsl(var(--border))" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--surface-2))"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <Pencil size={11} />
          Edit card
        </button>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150"
          style={{ border: "1px solid hsl(var(--border))" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--surface-2))"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <SkipForward size={11} />
          Skip card
        </button>
      </div>

      {/* Exiting overlay */}
      {exiting && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: "hsl(var(--background))",
            opacity: 0,
            animation: "fade-in 0.2s ease forwards",
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 3: Session Complete
// ─────────────────────────────────────────────────────────────────────────────
interface CompleteProps {
  results: ReviewResult[];
  queue: Flashcard[];
  elapsedSeconds: number;
  streak: number;
  onStudyAgain: () => void;
  onDashboard: () => void;
}

function SessionComplete({ results, queue, elapsedSeconds, streak, onStudyAgain, onDashboard }: CompleteProps) {
  const { cards } = useDeckStore();
  const total   = results.length;
  const correct = results.filter((r) => r.quality >= 3).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const counts = {
    blackout: results.filter((r) => r.quality === 0).length,
    hard:     results.filter((r) => r.quality === 2).length,
    good:     results.filter((r) => r.quality === 3).length,
    easy:     results.filter((r) => r.quality === 5).length,
  };
  const maxCount = Math.max(...Object.values(counts), 1);

  const BAR_DATA = [
    { label: "Blackout", emoji: "🔴", count: counts.blackout, color: "#f85149" },
    { label: "Hard",     emoji: "🟠", count: counts.hard,     color: "#d29922" },
    { label: "Good",     emoji: "🟡", count: counts.good,     color: "#3fb950" },
    { label: "Easy",     emoji: "🟢", count: counts.easy,     color: "#39d353" },
  ];

  // Next reviews for studied cards
  const reviewedCards = queue
    .filter((q) => results.find((r) => r.cardId === q.id))
    .map((q) => {
      const latest = cards.find((c) => c.id === q.id);
      return latest ?? q;
    })
    .filter((c) => c.nextReview)
    .sort((a, b) => new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 animate-fade-in">
      <div className="w-full max-w-xl space-y-5">

        {/* Trophy header */}
        <div className="text-center space-y-1">
          <div className="text-5xl mb-3">
            {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📖"}
          </div>
          <h2 className="text-2xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Session Complete!
          </h2>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {accuracy >= 80 ? "Excellent work! You're mastering this material." : accuracy >= 50 ? "Good session. Keep up the practice." : "Keep going — repetition builds mastery."}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Target,    label: "Reviewed",  value: total,               color: "hsl(var(--primary))",     sub: "cards" },
            { icon: CheckCircle2, label: "Accuracy", value: `${accuracy}%`,    color: "hsl(var(--success))",     sub: "correct" },
            { icon: Clock,     label: "Time",       value: formatDuration(elapsedSeconds), color: "hsl(var(--warning))", sub: "elapsed" },
            { icon: Flame,     label: "Streak",     value: streak,              color: "#f78166",                 sub: "days 🔥" },
          ].map(({ icon: Icon, label, value, color, sub }) => (
            <div
              key={label}
              className="ds-card p-3 text-center space-y-1"
              style={{ background: "hsl(var(--surface))" }}
            >
              <Icon size={16} className="mx-auto" style={{ color }} />
              <p className="font-mono text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px] leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Bar chart breakdown */}
        <div className="ds-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Rating Breakdown
            </p>
          </div>
          <div className="space-y-2.5">
            {BAR_DATA.map(({ label, emoji, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm w-16 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {emoji} {label}
                </span>
                <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: "hsl(var(--surface-2))" }}>
                  <div
                    className="h-full rounded transition-all duration-700 ease-out flex items-center px-2"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: `${color}70`,
                      minWidth: count > 0 ? "2rem" : 0,
                    }}
                  >
                    {count > 0 && (
                      <span className="text-[10px] font-mono font-bold" style={{ color }}>{count}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono w-4 text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next review schedule */}
        {reviewedCards.length > 0 && (
          <div className="ds-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "hsl(var(--warning))" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                Next Reviews
              </p>
            </div>
            <div className="space-y-2">
              {reviewedCards.map((c) => {
                const catColor = CAT_COLORS[c.category] ?? "hsl(var(--primary))";
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor }} />
                      <span className="truncate" style={{ color: "hsl(var(--foreground))" }}>{c.front}</span>
                    </div>
                    <span className="ml-3 shrink-0 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {fmtDate(c.nextReview)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDashboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: "hsl(var(--surface-2))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </button>
          <button
            onClick={onStudyAgain}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <RotateCcw size={14} />
            Study Again
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root: StudyPage — orchestrates all three screens
// ─────────────────────────────────────────────────────────────────────────────
type Screen = "setup" | "review" | "complete";

export function StudyPage() {
  const { cards, streak, setActiveNav, addStudySession } = useDeckStore();
  const [screen, setScreen]     = useState<Screen>("setup");
  const [queue, setQueue]       = useState<Flashcard[]>([]);
  const [results, setResults]   = useState<ReviewResult[]>([]);
  const [elapsed, setElapsed]   = useState(0);

  function handleStart(q: Flashcard[]) {
    setQueue(q);
    setResults([]);
    setElapsed(0);
    setScreen("review");
  }

  function handleComplete(r: ReviewResult[], secs: number) {
    setResults(r);
    setElapsed(secs);
    const total   = r.length;
    const correct = r.filter((x) => x.quality >= 3).length;
    addStudySession({
      date: new Date().toISOString(),
      reviewed: total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      durationSec: secs,
    });
    setScreen("complete");
  }

  function handleStudyAgain() {
    setScreen("setup");
  }

  function handleEditCard(id: string) {
    // Navigate to add-card with the card id pre-selected (best-effort)
    setActiveNav("all-cards");
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4 animate-fade-in">
        <Brain size={40} style={{ color: "hsl(var(--muted-foreground))" }} />
        <p className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>No cards yet!</p>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Add some cards first to start studying.</p>
        <button
          onClick={() => setActiveNav("add-card")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          Add your first card
        </button>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <SessionSetup
        cards={cards}
        onStart={handleStart}
        onGoToDashboard={() => setActiveNav("dashboard")}
      />
    );
  }

  if (screen === "review") {
    return (
      <CardReview
        queue={queue}
        onComplete={handleComplete}
        onEditCard={handleEditCard}
      />
    );
  }

  return (
    <SessionComplete
      results={results}
      queue={queue}
      elapsedSeconds={elapsed}
      streak={streak}
      onStudyAgain={handleStudyAgain}
      onDashboard={() => setActiveNav("dashboard")}
    />
  );
}
