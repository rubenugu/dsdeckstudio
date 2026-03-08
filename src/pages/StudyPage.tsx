import { useState } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Shuffle } from "lucide-react";

export function StudyPage() {
  const { cards, recordReview } = useDeckStore();
  const [queue, setQueue] = useState(() => [...cards].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [done, setDone] = useState(false);

  const card = queue[index];

  function handleAnswer(correct: boolean) {
    recordReview(card.id, correct);
    if (correct) setSessionCorrect((p) => p + 1);
    setSessionTotal((p) => p + 1);
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex((p) => p + 1);
      setFlipped(false);
    }
  }

  function restart() {
    setQueue([...cards].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
    setSessionCorrect(0);
    setSessionTotal(0);
    setDone(false);
  }

  const diffColor: Record<string, string> = {
    easy: "hsl(var(--success))",
    medium: "hsl(var(--warning))",
    hard: "hsl(var(--destructive))",
  };

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
    const accuracy = Math.round((sessionCorrect / sessionTotal) * 100);
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-5 animate-fade-in">
        <div
          className="ds-card p-8 text-center max-w-sm w-full space-y-4"
        >
          <p className="text-3xl">🎉</p>
          <h2 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Session complete!
          </h2>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="font-mono text-2xl" style={{ color: "hsl(var(--success))" }}>{sessionCorrect}</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>correct</p>
            </div>
            <div>
              <p className="font-mono text-2xl" style={{ color: "hsl(var(--destructive))" }}>{sessionTotal - sessionCorrect}</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>incorrect</p>
            </div>
            <div>
              <p className="font-mono text-2xl" style={{ color: "hsl(var(--primary))" }}>{accuracy}%</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>accuracy</p>
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
      {/* Progress */}
      <div className="w-full max-w-xl">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>Card {index + 1} of {queue.length}</span>
          <span className="font-mono">{Math.round(((index) / queue.length) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "hsl(var(--surface-2))" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(index / queue.length) * 100}%`, background: "hsl(var(--primary))" }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="ds-card w-full max-w-xl p-6 space-y-4">
        {/* Meta */}
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
        </div>

        {/* Question */}
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Question
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
            {card.question}
          </p>
        </div>

        {/* Flip */}
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flex items-center gap-1.5 text-xs transition-all duration-200"
          style={{ color: "hsl(var(--primary))" }}
        >
          {flipped ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {flipped ? "Hide answer" : "Show answer"}
        </button>

        {/* Answer */}
        {flipped && (
          <div className="animate-fade-in space-y-3">
            <div
              className="terminal-block p-4 text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {card.answer}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all duration-200"
                style={{
                  background: "hsl(var(--destructive) / 0.1)",
                  color: "hsl(var(--destructive))",
                  border: "1px solid hsl(var(--destructive) / 0.3)",
                }}
              >
                <XCircle size={15} />
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all duration-200"
                style={{
                  background: "hsl(var(--success) / 0.1)",
                  color: "hsl(var(--success))",
                  border: "1px solid hsl(var(--success) / 0.3)",
                }}
              >
                <CheckCircle2 size={15} />
                Correct
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
