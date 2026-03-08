import { useState } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Shuffle, Code } from "lucide-react";

// Quality rating labels mapped to SM-2 scale 0–5
const QUALITY_OPTIONS = [
  { value: 0, label: "Blackout",   color: "hsl(var(--destructive))" },
  { value: 2, label: "Wrong",      color: "hsl(354 65% 60%)" },
  { value: 3, label: "Hard",       color: "hsl(var(--warning))" },
  { value: 4, label: "Good",       color: "hsl(var(--success))" },
  { value: 5, label: "Easy",       color: "#3ddc84" },
];

export function StudyPage() {
  const { cards, recordReview } = useDeckStore();

  // Prioritise cards due for review (nextReview <= now), else shuffle all
  const [queue] = useState(() => {
    const now = Date.now();
    const due = cards.filter(
      (c) => !c.nextReview || new Date(c.nextReview).getTime() <= now
    );
    const other = cards.filter(
      (c) => c.nextReview && new Date(c.nextReview).getTime() > now
    );
    return [
      ...due.sort(() => Math.random() - 0.5),
      ...other.sort(() => Math.random() - 0.5),
    ];
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const card = queue[index];

  function handleQuality(quality: number) {
    recordReview(card.id, quality);
    setSessionResults((p) => [...p, quality]);
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex((p) => p + 1);
      setFlipped(false);
    }
  }

  function restart() {
    window.location.reload(); // simplest way to rebuild queue with new nextReview values
  }

  const diffColor: Record<string, string> = {
    beginner: "hsl(var(--success))",
    intermediate: "hsl(var(--warning))",
    advanced: "hsl(var(--destructive))",
  };

  const dueCount = queue.filter(
    (c) => !c.nextReview || new Date(c.nextReview).getTime() <= Date.now()
  ).length;

  if (cards.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center gap-3">
        <p className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          No cards yet!
        </p>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Add some cards first to start studying.
        </p>
      </div>
    );
  }

  if (done) {
    const avg = sessionResults.reduce((a, b) => a + b, 0) / sessionResults.length;
    const correct = sessionResults.filter((q) => q >= 3).length;
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-5 animate-fade-in">
        <div className="ds-card p-8 text-center max-w-sm w-full space-y-5">
          <p className="text-3xl">🎉</p>
          <h2 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Session complete!
          </h2>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="font-mono text-2xl" style={{ color: "hsl(var(--success))" }}>{correct}</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>correct</p>
            </div>
            <div>
              <p className="font-mono text-2xl" style={{ color: "hsl(var(--destructive))" }}>{sessionResults.length - correct}</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>incorrect</p>
            </div>
            <div>
              <p className="font-mono text-2xl" style={{ color: "hsl(var(--primary))" }}>{avg.toFixed(1)}</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>avg quality</p>
            </div>
          </div>
          <button
            onClick={restart}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            style={{
              background: "hsl(var(--primary) / 0.15)",
              color: "hsl(var(--primary))",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <Shuffle size={14} />
            Study again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center gap-5 animate-fade-in">
      {/* Progress + due indicator */}
      <div className="w-full max-w-xl">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>
            Card {index + 1} of {queue.length}
            {dueCount > 0 && (
              <span
                className="ml-2 font-mono"
                style={{ color: "hsl(var(--warning))" }}
              >
                ({dueCount} due)
              </span>
            )}
          </span>
          <span className="font-mono">{Math.round((index / queue.length) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "hsl(var(--surface-2))" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(index / queue.length) * 100}%`,
              background: "hsl(var(--primary))",
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="ds-card w-full max-w-xl p-6 space-y-4">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded font-medium"
            style={{
              background: "hsl(var(--surface-2))",
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            {card.category}
          </span>
          {card.subcategory && card.subcategory !== card.category && (
            <span
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {card.subcategory}
            </span>
          )}
          <span
            className="text-[10px] px-2 py-0.5 rounded font-medium capitalize"
            style={{
              background: `${diffColor[card.difficulty]}18`,
              color: diffColor[card.difficulty],
              border: `1px solid ${diffColor[card.difficulty]}40`,
            }}
          >
            {card.difficulty}
          </span>
          {card.repetitions > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded font-mono ml-auto"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              rep #{card.repetitions} · EF {card.easeFactor.toFixed(2)}
            </span>
          )}
        </div>

        {/* Front */}
        <div>
          <p
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Question
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
            {card.front}
          </p>
        </div>

        {/* Flip button */}
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flex items-center gap-1.5 text-xs transition-all duration-200"
          style={{ color: "hsl(var(--primary))" }}
        >
          {flipped ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {flipped ? "Hide answer" : "Reveal answer"}
        </button>

        {/* Back + code + rating */}
        {flipped && (
          <div className="animate-fade-in space-y-3">
            {/* Back text */}
            <div
              className="terminal-block p-4 text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {card.back}
            </div>

            {/* Code example */}
            {card.codeExample && (
              <div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5"
                  style={{
                    background: "hsl(var(--primary) / 0.08)",
                    border: "1px solid hsl(var(--border))",
                    borderBottom: "none",
                    borderRadius: "calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0",
                  }}
                >
                  <Code size={11} style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-[10px] font-mono" style={{ color: "hsl(var(--primary))" }}>
                    Python
                  </span>
                </div>
                <div
                  className="terminal-block p-3 text-xs leading-relaxed whitespace-pre-wrap"
                  style={{
                    color: "hsl(133, 57%, 70%)",
                    borderRadius: "0 0 calc(var(--radius) - 2px) calc(var(--radius) - 2px)",
                  }}
                >
                  {card.codeExample}
                </div>
              </div>
            )}

            {/* SM-2 quality buttons */}
            <div>
              <p
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                How well did you know this?
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {QUALITY_OPTIONS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => handleQuality(value)}
                    className="flex flex-col items-center py-2 px-1 rounded-md text-center transition-all duration-200"
                    style={{
                      background: `${color}12`,
                      color,
                      border: `1px solid ${color}40`,
                      fontSize: "10px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${color}28`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${color}12`;
                    }}
                  >
                    <span className="font-mono font-bold text-sm">{value}</span>
                    <span className="leading-tight mt-0.5">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
