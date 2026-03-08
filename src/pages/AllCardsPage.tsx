import { useState, useMemo } from "react";
import { useDeckStore, type Flashcard, type DSCategory, type Difficulty, DS_CATEGORIES } from "@/store/useDeckStore";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";
import { Search, X, Code, Calendar, LayoutGrid, Plus, ChevronDown } from "lucide-react";
import { SyntaxBlock } from "@/components/SyntaxBlock";

// ── Category colour map ───────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<DSCategory, string> = {
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

type SortKey = "due" | "recent" | "hardest" | "alpha";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "due",     label: "Due for review" },
  { key: "recent",  label: "Recently added" },
  { key: "hardest", label: "Hardest first" },
  { key: "alpha",   label: "Alphabetical" },
];

// ── Card preview ─────────────────────────────────────────────────────────────

function cardStatus(card: Flashcard): "mastered" | "needs-practice" | null {
  if (card.interval > 21 && (card.quality ?? 0) >= 4) return "mastered";
  if ((card.quality ?? 5) <= 2 && card.repetitions >= 3) return "needs-practice";
  return null;
}

function CardPreview({ card, onClick }: { card: Flashcard; onClick: () => void }) {
  const color = CATEGORY_COLORS[card.category];
  const diffColor = DIFF_COLORS[card.difficulty];
  const isDue = !card.nextReview || new Date(card.nextReview).getTime() <= Date.now();
  const status = cardStatus(card);

  return (
    <button
      onClick={onClick}
      className="ds-card text-left w-full p-4 flex flex-col gap-3 group transition-all duration-200 cursor-pointer"
      style={{ minHeight: 140 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
        >
          {card.category}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {status === "mastered" && (
            <span className="badge-mastered">✨ Mastered</span>
          )}
          {status === "needs-practice" && (
            <span className="badge-needs-practice">🔴 Needs practice</span>
          )}
          {isDue && !status && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "#d2992218", color: "#d29922", border: "1px solid #d2992240" }}
            >
              DUE
            </span>
          )}
          {card.codeExample && (
            <Code size={12} style={{ color: "#58a6ff", opacity: 0.7 }} />
          )}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: diffColor }}
            title={card.difficulty}
          />
        </div>
      </div>

      {/* Front text */}
      <p
        className="text-sm leading-snug flex-1"
        style={{
          color: "hsl(var(--foreground))",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {card.front}
      </p>

      {/* Footer: tags + stats */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))" }}
            >
              #{tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="text-[10px] px-1 py-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              +{card.tags.length - 3}
            </span>
          )}
        </div>
        {card.repetitions > 0 && (
          <span className="text-[10px] font-mono shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
            ×{card.repetitions}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Card Detail Modal ──────────────────────────────────────────────────────────

function CardModal({ card, onClose }: { card: Flashcard; onClose: () => void }) {
  const color = CATEGORY_COLORS[card.category];
  const diffColor = DIFF_COLORS[card.difficulty];
  const isDue = !card.nextReview || new Date(card.nextReview).getTime() <= Date.now();
  const { deleteCard, setActiveNav } = useDeckStore();
  const { deleteCard: deleteCardRemote } = useSupabaseSync();

  function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "hsl(0 0% 0% / 0.65)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl animate-fade-in"
        style={{
          background: "hsl(var(--surface))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 24px 48px hsl(0 0% 0% / 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
            >
              {card.category}
            </span>
            <span
              className="text-[11px] px-2.5 py-1 rounded-full capitalize font-medium"
              style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40` }}
            >
              {card.difficulty}
            </span>
            {card.subcategory && card.subcategory !== card.category && (
              <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {card.subcategory}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-all duration-200"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#21262d")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Front */}
          <div>
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Front
            </p>
            <p className="text-base leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
              {card.front}
            </p>
          </div>

          {/* Back */}
          <div>
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Back
            </p>
            <div
              className="terminal-block p-4 text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {card.back}
            </div>
          </div>

          {/* Code example */}
          {card.codeExample && (
            <div>
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Python Example
              </p>
              <SyntaxBlock code={card.codeExample} />
            </div>
          )}

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{
                    background: "hsl(var(--surface-2))",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Review history */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1"
            style={{ borderTop: "1px solid hsl(var(--border))" }}
          >
            {[
              { label: "Repetitions",   value: card.repetitions },
              { label: "Ease Factor",   value: card.easeFactor.toFixed(2) },
              { label: "Interval",      value: `${card.interval}d` },
              { label: "Last Quality",  value: card.quality != null ? `${card.quality}/5` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-3 rounded-lg" style={{ background: "hsl(var(--surface-2))" }}>
                <p className="font-mono text-lg font-semibold" style={{ color: "hsl(var(--primary))" }}>
                  {value}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              Created {formatDate(card.created)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              Last reviewed {formatDate(card.lastReviewed)}
            </span>
            <span
              className="flex items-center gap-1.5"
              style={{ color: isDue ? "#d29922" : "hsl(var(--muted-foreground))" }}
            >
              <Calendar size={11} />
              Next review {isDue ? "now due" : formatDate(card.nextReview)}
            </span>
          </div>

          {/* Actions */}
          <div
            className="flex gap-2 pt-1"
            style={{ borderTop: "1px solid hsl(var(--border))" }}
          >
            <button
              onClick={() => { setActiveNav("study"); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              style={{
                background: "hsl(var(--primary) / 0.12)",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary) / 0.3)",
              }}
            >
              Study this deck
            </button>
            <button
              onClick={() => { deleteCard(card.id); deleteCardRemote(card.id); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ml-auto"
              style={{
                background: "hsl(var(--destructive) / 0.08)",
                color: "hsl(var(--destructive))",
                border: "1px solid hsl(var(--destructive) / 0.25)",
              }}
            >
              Delete card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AllCardsPage() {
  const { cards, setActiveNav } = useDeckStore();
  const { lang } = useLang();

  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<DSCategory>>(new Set());
  const [diffFilter, setDiffFilter] = useState<"all" | Difficulty>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<Flashcard | null>(null);

  function toggleCat(cat: DSCategory) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const now = Date.now();
    return cards
      .filter((c) => {
        const matchCat = selectedCats.size === 0 || selectedCats.has(c.category);
        const matchDiff = diffFilter === "all" || c.difficulty === diffFilter;
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.subcategory.toLowerCase().includes(q);
        return matchCat && matchDiff && matchSearch;
      })
      .sort((a, b) => {
        if (sort === "due") {
          const aDue = a.nextReview ? new Date(a.nextReview).getTime() : 0;
          const bDue = b.nextReview ? new Date(b.nextReview).getTime() : 0;
          return aDue - bDue;
        }
        if (sort === "recent") return new Date(b.created).getTime() - new Date(a.created).getTime();
        if (sort === "hardest") {
          const order = { advanced: 0, intermediate: 1, beginner: 2 };
          return order[a.difficulty] - order[b.difficulty];
        }
        return a.front.localeCompare(b.front);
      });
  }, [cards, selectedCats, diffFilter, search, sort]);

  const sortLabel = SORT_OPTIONS.find((s) => s.key === sort)?.label ?? "Sort";

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
        >
          <LayoutGrid size={28} style={{ color: "hsl(var(--primary))", opacity: 0.7 }} />
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {t("cards_empty", lang)}
          </p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {lang === "es" ? "Crea la primera y comienza a aprender." : "Add your first card to start building your DS deck."}
          </p>
        </div>
        <button
          onClick={() => setActiveNav("add-card")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
          style={{
            background: "hsl(var(--primary) / 0.12)",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.3)",
          }}
        >
          <Plus size={15} />
          {t("cards_add_first", lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {t("cards_title", lang)}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {cards.length} total · {filtered.length} shown
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
            style={{
              background: "hsl(var(--surface))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            {sortLabel}
            <ChevronDown size={13} />
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden animate-fade-in min-w-40"
              style={{
                background: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 24px hsl(0 0% 0% / 0.4)",
              }}
            >
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setSort(key); setSortOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs transition-all duration-150"
                  style={{
                    color: sort === key ? "#58a6ff" : "hsl(var(--foreground))",
                    background: sort === key ? "#58a6ff12" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (sort !== key) (e.currentTarget as HTMLButtonElement).style.background = "#21262d"; }}
                  onMouseLeave={(e) => { if (sort !== key) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
      >
        <Search size={14} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cards, tags, subcategories…"
          className="bg-transparent text-sm flex-1 outline-none"
          style={{ color: "hsl(var(--foreground))" }}
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {DS_CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const active = selectedCats.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-200"
              style={
                active
                  ? { background: `${color}22`, color, border: `1px solid ${color}60` }
                  : {
                      background: "hsl(var(--surface))",
                      color: "hsl(var(--muted-foreground))",
                      border: "1px solid hsl(var(--border))",
                    }
              }
            >
              {cat}
            </button>
          );
        })}
        {selectedCats.size > 0 && (
          <button
            onClick={() => setSelectedCats(new Set())}
            className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 transition-all duration-200"
            style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-1.5">
        {(["all", "beginner", "intermediate", "advanced"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className="text-[11px] px-3 py-1 rounded-md capitalize transition-all duration-200"
            style={
              diffFilter === d
                ? {
                    background: d === "all" ? "hsl(var(--primary) / 0.15)" : `${DIFF_COLORS[d as Difficulty]}18`,
                    color: d === "all" ? "hsl(var(--primary))" : DIFF_COLORS[d as Difficulty],
                    border: `1px solid ${d === "all" ? "hsl(var(--primary) / 0.3)" : `${DIFF_COLORS[d as Difficulty]}40`}`,
                    fontWeight: 600,
                  }
                : {
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border))",
                  }
            }
          >
            {d === "all" ? "All" : d}
          </button>
        ))}
      </div>

      {/* No results */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-base" style={{ color: "hsl(var(--foreground))" }}>
            No cards match your filters
          </p>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Try adjusting your search or clearing filters
          </p>
          <button
            onClick={() => { setSearch(""); setSelectedCats(new Set()); setDiffFilter("all"); }}
            className="text-xs mt-2 px-3 py-1.5 rounded-md transition-all duration-200"
            style={{
              background: "hsl(var(--surface))",
              color: "hsl(var(--primary))",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((card) => (
            <CardPreview key={card.id} card={card} onClick={() => setSelected(card)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
