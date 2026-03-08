import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, X, Clock, Code, ChevronRight } from "lucide-react";
import { useDeckStore, type Flashcard, type DSCategory } from "@/store/useDeckStore";
import { SyntaxBlock } from "@/components/SyntaxBlock";

// ── Category colours ───────────────────────────────────────────────────────────
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
  beginner:     "#3fb950",
  intermediate: "#d29922",
  advanced:     "#ff6e6e",
};

const RECENT_STORAGE_KEY = "dsdeck_recent_searches";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function saveRecent(searches: string[]) {
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
}
function addRecent(q: string) {
  if (!q.trim()) return;
  const prev = loadRecent().filter((s) => s !== q);
  saveRecent([q, ...prev]);
}

// ── Fuzzy search helper ────────────────────────────────────────────────────────
function score(card: Flashcard, q: string): number {
  const lq = q.toLowerCase();
  let s = 0;
  if (card.front.toLowerCase().includes(lq)) s += 10;
  if (card.front.toLowerCase().startsWith(lq)) s += 5;
  if (card.back.toLowerCase().includes(lq)) s += 4;
  if (card.category.toLowerCase().includes(lq)) s += 3;
  if (card.subcategory?.toLowerCase().includes(lq)) s += 3;
  if (card.tags.some((t) => t.toLowerCase().includes(lq))) s += 2;
  if (card.codeExample?.toLowerCase().includes(lq)) s += 1;
  return s;
}

// ── Highlight matching text ────────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "hsl(var(--primary) / 0.25)",
          color: "hsl(var(--primary))",
          borderRadius: "2px",
          padding: "0 1px",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Card Detail Modal (shown from within palette) ─────────────────────────────
function CardDetailModal({
  card,
  onClose,
}: {
  card: Flashcard;
  onClose: () => void;
}) {
  const { deleteCard, setActiveNav } = useDeckStore();
  const color = CAT_COLORS[card.category] ?? "hsl(var(--primary))";
  const diffColor = DIFF_COLORS[card.difficulty];

  function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Esc closes detail, returning to palette (caller handles)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.72)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-xl"
        style={{
          background: "hsl(var(--surface))",
          border: `1px solid ${color}60`,
          boxShadow: `0 24px 60px hsl(0 0% 0% / 0.6), 0 0 0 1px ${color}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
              {card.category}
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full capitalize font-medium"
              style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40` }}>
              {card.difficulty}
            </span>
            {card.subcategory && (
              <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {card.subcategory}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md" style={{ color: "hsl(var(--muted-foreground))" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Front */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Front</p>
            <p className="text-base leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{card.front}</p>
          </div>
          {/* Back */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Back</p>
            <div className="terminal-block p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--foreground))" }}>
              {card.back}
            </div>
          </div>
          {/* Code */}
          {card.codeExample && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Python Example</p>
              <SyntaxBlock code={card.codeExample} />
            </div>
          )}
          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* SM-2 stats */}
          <div className="grid grid-cols-4 gap-3 pt-1" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            {[
              { label: "Repetitions", value: card.repetitions },
              { label: "Ease Factor", value: card.easeFactor.toFixed(2) },
              { label: "Interval",    value: `${card.interval}d` },
              { label: "Quality",     value: card.quality != null ? `${card.quality}/5` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-3 rounded-lg" style={{ background: "hsl(var(--surface-2))" }}>
                <p className="font-mono text-lg font-semibold" style={{ color: "hsl(var(--primary))" }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
              </div>
            ))}
          </div>
          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>Created {formatDate(card.created)}</span>
            <span>Last reviewed {formatDate(card.lastReviewed)}</span>
            <span>Next review {formatDate(card.nextReview)}</span>
          </div>
          {/* Actions */}
          <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <button
              onClick={() => { setActiveNav("study"); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
            >
              Study this deck
            </button>
            <button
              onClick={() => { deleteCard(card.id); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium ml-auto"
              style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))", border: "1px solid hsl(var(--destructive) / 0.25)" }}
            >
              Delete card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main CommandPalette ────────────────────────────────────────────────────────
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { cards } = useDeckStore();
  const [query, setQuery]         = useState("");
  const [debouncedQ, setDQ]       = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent]       = useState<string[]>([]);
  const [detailCard, setDetailCard] = useState<Flashcard | null>(null);

  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout>>();

  // Load recent on open
  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      setQuery("");
      setDQ("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounce query → debouncedQ (150 ms)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDQ(query), 150);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Reset active index when results change
  useEffect(() => setActiveIdx(0), [debouncedQ]);

  // Fuzzy filtered results
  const results = useMemo(() => {
    if (!debouncedQ.trim()) return [];
    return cards
      .map((c) => ({ card: c, s: score(c, debouncedQ) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map(({ card }) => card);
  }, [cards, debouncedQ]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const openCard = useCallback((card: Flashcard) => {
    addRecent(card.front);
    setRecent(loadRecent());
    setDetailCard(card);
  }, []);

  const applyRecent = useCallback((q: string) => {
    setQuery(q);
    setDQ(q);
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const total = results.length;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, total - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[activeIdx]) { openCard(results[activeIdx]); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIdx, onClose, openCard]);

  if (!open) return null;

  const showRecent = !debouncedQ.trim() && recent.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Palette panel */}
      <div
        className="fixed left-1/2 top-[10%] z-50 w-full max-w-2xl -translate-x-1/2"
        style={{ padding: "0 16px" }}
      >
        <div
          className="w-full rounded-xl overflow-hidden"
          style={{
            background: "hsl(var(--surface))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 32px 80px hsl(0 0% 0% / 0.7), 0 0 0 1px hsl(var(--primary) / 0.08)",
          }}
        >
          {/* ── Input row ─────────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid hsl(var(--border))" }}
          >
            <Search size={16} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards, categories, tags…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              style={{ color: "hsl(var(--foreground))" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setDQ(""); }} style={{ color: "hsl(var(--muted-foreground))" }}>
                <X size={14} />
              </button>
            )}
            <kbd
              className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{
                background: "hsl(var(--surface-2))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              ESC
            </kbd>
          </div>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div ref={listRef} style={{ maxHeight: 440, overflowY: "auto" }}>

            {/* Recent searches (when query is empty) */}
            {showRecent && (
              <div>
                <p
                  className="px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Recent searches
                </p>
                {recent.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => applyRecent(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-100"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--surface-2))")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Clock size={13} style={{ flexShrink: 0 }} />
                    <span className="truncate">{r}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty — no query */}
            {!debouncedQ.trim() && !showRecent && (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Start typing to search across all {cards.length} cards…
                </p>
              </div>
            )}

            {/* Results */}
            {debouncedQ.trim() && results.length === 0 && (
              <div className="py-12 text-center space-y-1">
                <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  No results for "{debouncedQ}"
                </p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Try a different keyword, category, or tag
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div>
                <p
                  className="px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                {results.map((card, idx) => {
                  const color     = CAT_COLORS[card.category] ?? "#58a6ff";
                  const diffColor = DIFF_COLORS[card.difficulty];
                  const isActive  = idx === activeIdx;

                  return (
                    <button
                      key={card.id}
                      data-idx={idx}
                      onClick={() => openCard(card)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-75"
                      style={{
                        background: isActive ? "hsl(var(--surface-2))" : "transparent",
                        borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                      }}
                    >
                      {/* Category dot */}
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: color }}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug truncate" style={{ color: "hsl(var(--foreground))" }}>
                          <Highlight text={card.front} query={debouncedQ} />
                        </p>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                          <Highlight text={card.back.slice(0, 100)} query={debouncedQ} />
                        </p>
                      </div>

                      {/* Right badges */}
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        {card.codeExample && (
                          <Code size={11} style={{ color: "hsl(var(--primary))", opacity: 0.7 }} />
                        )}
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                          style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}30` }}
                        >
                          {card.difficulty.slice(0, 3)}
                        </span>
                        <span
                          className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
                        >
                          {card.category.split(" ")[0]}
                        </span>
                        {isActive && (
                          <ChevronRight size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer hint ───────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-4 px-4 py-2.5 text-[10px]"
            style={{
              borderTop: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>ESC</kbd>
              close
            </span>
            <span className="ml-auto opacity-60">{cards.length} cards indexed</span>
          </div>
        </div>
      </div>

      {/* Card detail */}
      {detailCard && (
        <CardDetailModal
          card={detailCard}
          onClose={() => setDetailCard(null)}
        />
      )}
    </>
  );
}
