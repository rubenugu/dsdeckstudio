import { useDeckStore } from "@/store/useDeckStore";
import { Trash2, RotateCcw } from "lucide-react";

export function SettingsPage() {
  const { cards } = useDeckStore();
  const store = useDeckStore();

  function clearAll() {
    if (window.confirm("Delete ALL cards? This cannot be undone.")) {
      // Reset to empty
      cards.forEach((c) => store.deleteCard(c.id));
    }
  }

  const totalReviewed = cards.reduce((s, c) => s + c.timesReviewed, 0);
  const totalCorrect = cards.reduce((s, c) => s + c.timesCorrect, 0);

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
            ["Total reviews", totalReviewed],
            ["Total correct", totalCorrect],
            [
              "Overall accuracy",
              totalReviewed > 0 ? `${Math.round((totalCorrect / totalReviewed) * 100)}%` : "—",
            ],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
              <span className="font-mono" style={{ color: "hsl(var(--foreground))" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Storage info */}
        <div className="ds-card p-5 space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Storage
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Cards are persisted in your browser's <span className="font-mono">localStorage</span> under the key{" "}
            <span
              className="terminal-block px-1.5 py-0.5 rounded inline"
              style={{ color: "hsl(var(--primary))" }}
            >
              ds-deck-storage
            </span>
            . Data stays local — nothing is sent to any server.
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
            Permanently delete all {cards.length} card{cards.length !== 1 ? "s" : ""} from your deck.
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
            DS Deck · v0.1.0
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            A minimal, keyboard-friendly flashcard tracker for data scientists.
          </p>
        </div>
      </div>
    </div>
  );
}
