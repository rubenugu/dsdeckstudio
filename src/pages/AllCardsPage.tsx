import { useState } from "react";
import { useDeckStore, type Flashcard, type Category } from "@/store/useDeckStore";
import { Trash2, ChevronDown, ChevronUp, Search } from "lucide-react";

const CATEGORIES: Category[] = ["Python", "Statistics", "ML", "Deep Learning", "SQL", "Data Engineering", "Other"];

function CardRow({ card }: { card: Flashcard }) {
  const { deleteCard } = useDeckStore();
  const [open, setOpen] = useState(false);
  const accuracy = card.timesReviewed > 0 ? Math.round((card.timesCorrect / card.timesReviewed) * 100) : null;

  const diffColor: Record<string, string> = {
    easy: "hsl(var(--success))",
    medium: "hsl(var(--warning))",
    hard: "hsl(var(--destructive))",
  };

  return (
    <div
      className="ds-card overflow-hidden transition-all duration-200"
      style={{ animationDelay: "0ms" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left transition-colors duration-200"
        style={{ background: "transparent" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>
            {card.question}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded hidden sm:block"
            style={{
              background: "hsl(var(--surface-2))",
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            {card.category}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded capitalize"
            style={{
              background: `${diffColor[card.difficulty]}18`,
              color: diffColor[card.difficulty],
              border: `1px solid ${diffColor[card.difficulty]}40`,
            }}
          >
            {card.difficulty}
          </span>
          {accuracy !== null && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary) / 0.25)",
              }}
            >
              {accuracy}%
            </span>
          )}
          {open ? (
            <ChevronUp size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          ) : (
            <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          )}
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-4 space-y-3 animate-fade-in"
          style={{ borderTop: "1px solid hsl(var(--border))" }}
        >
          <div
            className="terminal-block p-3 mt-3 text-xs leading-relaxed whitespace-pre-wrap"
            style={{ color: "hsl(var(--foreground))" }}
          >
            {card.answer}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>Reviews: <span className="font-mono">{card.timesReviewed}</span></span>
              <span>Correct: <span className="font-mono">{card.timesCorrect}</span></span>
              {card.tags.length > 0 && (
                <span className="hidden sm:inline">
                  Tags: {card.tags.map((t) => `#${t}`).join(" ")}
                </span>
              )}
            </div>
            <button
              onClick={() => deleteCard(card.id)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-all duration-200"
              style={{
                color: "hsl(var(--destructive))",
                background: "hsl(var(--destructive) / 0.08)",
                border: "1px solid hsl(var(--destructive) / 0.25)",
              }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AllCardsPage() {
  const { cards } = useDeckStore();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("All");

  const filtered = cards.filter((c) => {
    const matchesSearch =
      c.question.toLowerCase().includes(search.toLowerCase()) ||
      c.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "All" || c.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            All Cards
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {cards.length} cards total · {filtered.length} shown
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md flex-1 min-w-40"
          style={{
            background: "hsl(var(--surface))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <Search size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="bg-transparent text-xs flex-1 outline-none"
            style={{ color: "hsl(var(--foreground))" }}
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className="text-[11px] px-2.5 py-1 rounded transition-all duration-200"
              style={
                filterCat === cat
                  ? {
                      background: "hsl(var(--primary) / 0.15)",
                      color: "hsl(var(--primary))",
                      border: "1px solid hsl(var(--primary) / 0.3)",
                    }
                  : {
                      background: "hsl(var(--surface))",
                      color: "hsl(var(--muted-foreground))",
                      border: "1px solid hsl(var(--border))",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
            No cards match your filters.
          </p>
        ) : (
          filtered.map((card) => <CardRow key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}
