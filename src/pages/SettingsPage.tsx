import { useDeckStore } from "@/store/useDeckStore";
import { Trash2 } from "lucide-react";

export function SettingsPage() {
  const { cards } = useDeckStore();
  const store = useDeckStore();

  function clearAll() {
    if (window.confirm("Delete ALL cards? This cannot be undone.")) {
      cards.forEach((c) => store.deleteCard(c.id));
    }
  }

  const totalReps = cards.reduce((s, c) => s + c.repetitions, 0);
  const avgEF = cards.length > 0
    ? (cards.reduce((s, c) => s + c.easeFactor, 0) / cards.length).toFixed(2)
    : "–";
  const masteredCards = cards.filter((c) => c.easeFactor >= 2.5 && c.repetitions >= 3).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Manage your deck and preferences
        </p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Stats panel */}
        <div className="ds-card p-5 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Session Statistics
          </h2>
          {[
            ["Total cards", cards.length],
            ["Total repetitions", totalReps],
            ["Average ease factor", avgEF],
            ["Mastered cards (EF ≥ 2.5, reps ≥ 3)", masteredCards],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
              <span className="font-mono" style={{ color: "hsl(var(--foreground))" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* SM-2 info */}
        <div className="ds-card p-5 space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Spaced Repetition (SM-2)
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            DS Deck uses the <span className="font-mono" style={{ color: "hsl(var(--primary))" }}>SM-2</span> algorithm.
            Rate each card 0–5 after revealing the answer. Ratings ≥ 3 advance the interval;
            ratings &lt; 3 reset to day 1. The ease factor (EF) adjusts per card — higher EF means
            longer intervals.
          </p>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { q: 0, label: "Blackout" }, { q: 1, label: "Wrong" }, { q: 2, label: "Difficult" },
              { q: 3, label: "Hard" }, { q: 4, label: "Good" },
            ].map(({ q, label }) => (
              <div
                key={q}
                className="text-center py-1.5 rounded text-[10px]"
                style={{
                  background: "hsl(var(--surface-2))",
                  color: "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <div className="font-mono font-bold">{q}</div>
                <div>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage info */}
        <div className="ds-card p-5 space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Storage
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Cards are persisted in{" "}
            <span
              className="terminal-block px-1.5 py-0.5 rounded inline font-mono"
              style={{ color: "hsl(var(--primary))" }}
            >
              localStorage
            </span>{" "}
            under the key{" "}
            <span
              className="terminal-block px-1.5 py-0.5 rounded inline font-mono"
              style={{ color: "hsl(var(--primary))" }}
            >
              dsdeck_cards
            </span>
            . Nothing leaves your browser.
          </p>
        </div>

        {/* Danger zone */}
        <div
          className="ds-card p-5 space-y-3"
          style={{ borderColor: "hsl(var(--destructive) / 0.3)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--destructive))" }}>
            Danger Zone
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Permanently delete all {cards.length} card{cards.length !== 1 ? "s" : ""} and all review history.
          </p>
          <button
            onClick={clearAll}
            disabled={cards.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-30"
            style={{
              background: "hsl(var(--destructive) / 0.1)",
              color: "hsl(var(--destructive))",
              border: "1px solid hsl(var(--destructive) / 0.3)",
            }}
          >
            <Trash2 size={14} />
            Delete all cards
          </button>
        </div>

        {/* About */}
        <div className="ds-card p-5 space-y-1">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            About
          </h2>
          <p className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
            DS Deck · v1.0
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            A minimal, spaced-repetition flashcard tracker for data scientists.
          </p>
        </div>
      </div>
    </div>
  );
}
