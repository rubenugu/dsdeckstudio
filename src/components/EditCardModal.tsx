import { useState, useEffect } from "react";
import { X, Code, Plus, CheckCircle2, AlertCircle, ChevronDown, Tag } from "lucide-react";
import { useDeckStore, DS_CATEGORIES, type DSCategory, type Difficulty, type Flashcard } from "@/store/useDeckStore";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CATEGORY_COLORS } from "@/pages/AllCardsPage";
import { CodeEditor } from "@/components/CodeEditor";
import { TagInput } from "@/components/TagInput";

// ── Diff meta ─────────────────────────────────────────────────────────────────
const DIFF_META: Record<Difficulty, { color: string; label: string }> = {
  beginner:     { color: "#3fb950", label: "Beginner" },
  intermediate: { color: "#d29922", label: "Intermediate" },
  advanced:     { color: "#ff6e6e", label: "Advanced" },
};

const FRONT_MAX = 300;
const BACK_MAX  = 2000;

interface Props {
  cardId: string | null;
  onClose: () => void;
}

export function EditCardModal({ cardId, onClose }: Props) {
  const { cards, updateCard } = useDeckStore();
  const { upsertCard } = useSupabaseSync();
  const { user } = useAuth();

  const card = cards.find((c) => c.id === cardId) ?? null;

  const [front,       setFront]       = useState("");
  const [back,        setBack]        = useState("");
  const [codeExample, setCodeExample] = useState("");
  const [showCode,    setShowCode]    = useState(false);
  const [category,    setCategory]    = useState<DSCategory>("Machine Learning");
  const [subcategory, setSubcategory] = useState("");
  const [difficulty,  setDifficulty]  = useState<Difficulty>("intermediate");
  const [tags,        setTags]        = useState<string[]>([]);
  const [touched,     setTouched]     = useState({ front: false, back: false });

  // Seed form when card changes
  useEffect(() => {
    if (!card) return;
    setFront(card.front);
    setBack(card.back);
    setCodeExample(card.codeExample ?? "");
    setShowCode(!!card.codeExample);
    setCategory(card.category);
    setSubcategory(card.subcategory ?? "");
    setDifficulty(card.difficulty);
    setTags(card.tags ?? []);
    setTouched({ front: false, back: false });
  }, [cardId]);           // eslint-disable-line react-hooks/exhaustive-deps

  if (!card || !cardId) return null;

  const errors = {
    front: touched.front && !front.trim() ? "Question is required"
           : front.length > FRONT_MAX     ? `Max ${FRONT_MAX} chars` : "",
    back:  touched.back  && !back.trim()  ? "Answer is required"
           : back.length > BACK_MAX       ? `Max ${BACK_MAX} chars`  : "",
  };
  const isValid = !!front.trim() && !!back.trim() && !errors.front && !errors.back;

  const inputBase: React.CSSProperties = {
    background:   "hsl(var(--surface))",
    border:       "1px solid hsl(var(--border))",
    color:        "hsl(var(--foreground))",
    borderRadius: "var(--radius)",
    fontSize:     "13px",
    transition:   "border-color 200ms ease",
    outline:      "none",
    width:        "100%",
    padding:      "10px 12px",
  };

  const labelStyle: React.CSSProperties = {
    color:          "hsl(var(--muted-foreground))",
    fontSize:       "11px",
    textTransform:  "uppercase",
    letterSpacing:  "0.06em",
    fontWeight:     600,
    display:        "block",
    marginBottom:   "6px",
  };

  const focus = (e: React.FocusEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary))");
  const blur  = (e: React.FocusEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ front: true, back: true });
    if (!isValid) return;

    const updates: Partial<Flashcard> = {
      front:       front.trim(),
      back:        back.trim(),
      codeExample: codeExample.trim() || undefined,
      category,
      subcategory: subcategory.trim() || category,
      difficulty,
      tags,
    };

    updateCard(cardId, updates);
    const updated = { ...card, ...updates };
    if (user) upsertCard(updated as Flashcard);

    toast({ title: "Card updated", description: `"${front.slice(0, 50)}${front.length > 50 ? "…" : ""}"` });
    onClose();
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-xl flex flex-col animate-fade-in"
        style={{
          background:  "hsl(var(--surface))",
          border:      "1px solid hsl(var(--border))",
          boxShadow:   "0 24px 48px hsl(0 0% 0% / 0.5)",
          maxHeight:   "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Edit Card
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Changes are saved instantly — continue your session
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-all duration-200"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--surface-2))"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DSCategory)}
                style={{ ...inputBase, paddingLeft: "36px", cursor: "pointer", appearance: "none" }}
                onFocus={focus} onBlur={blur}
              >
                {DS_CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "#161b22" }}>{c}</option>
                ))}
              </select>
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
                style={{ background: CATEGORY_COLORS[category] }}
              />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label style={labelStyle}>Subcategory</label>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Probability"
              maxLength={80}
              style={inputBase}
              onFocus={focus} onBlur={blur}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label style={labelStyle}>Difficulty</label>
            <div
              className="grid grid-cols-3 p-1 rounded-lg gap-1"
              style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}
            >
              {(Object.entries(DIFF_META) as [Difficulty, typeof DIFF_META[Difficulty]][]).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDifficulty(key)}
                  className="py-2 px-1 rounded-md text-xs font-semibold capitalize transition-all duration-200"
                  style={
                    difficulty === key
                      ? { background: `${meta.color}18`, border: `1px solid ${meta.color}50`, color: meta.color }
                      : { color: "hsl(var(--muted-foreground))", border: "1px solid transparent" }
                  }
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>
              <span className="flex items-center gap-1.5">
                <Tag size={10} /> Tags
              </span>
            </label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Front */}
          <div>
            <label style={labelStyle}>
              Question <span style={{ color: "#ff6e6e" }}>*</span>
            </label>
            <textarea
              rows={3}
              value={front}
              maxLength={FRONT_MAX + 10}
              onChange={(e) => setFront(e.target.value)}
              onBlur={(e) => { setTouched((t) => ({ ...t, front: true })); blur(e); }}
              onFocus={focus}
              placeholder="What is your question?"
              style={{ ...inputBase, resize: "vertical", fontFamily: "inherit", borderColor: errors.front ? "#ff6e6e" : undefined }}
            />
            <div className="flex justify-between mt-1">
              {errors.front
                ? <span className="flex items-center gap-1 text-[11px]" style={{ color: "#ff6e6e" }}><AlertCircle size={11} />{errors.front}</span>
                : <span />}
              <span className="text-[10px] font-mono" style={{ color: front.length > FRONT_MAX * 0.85 ? "#d29922" : "hsl(var(--muted-foreground))" }}>
                {front.length}/{FRONT_MAX}
              </span>
            </div>
          </div>

          {/* Back */}
          <div>
            <label style={labelStyle}>
              Answer <span style={{ color: "#ff6e6e" }}>*</span>
            </label>
            <textarea
              rows={5}
              value={back}
              maxLength={BACK_MAX + 20}
              onChange={(e) => setBack(e.target.value)}
              onBlur={(e) => { setTouched((t) => ({ ...t, back: true })); blur(e); }}
              onFocus={focus}
              placeholder="The answer to your question…"
              style={{ ...inputBase, resize: "vertical", fontFamily: "inherit", borderColor: errors.back ? "#ff6e6e" : undefined }}
            />
            <div className="flex justify-between mt-1">
              {errors.back
                ? <span className="flex items-center gap-1 text-[11px]" style={{ color: "#ff6e6e" }}><AlertCircle size={11} />{errors.back}</span>
                : <span />}
              <span className="text-[10px] font-mono" style={{ color: back.length > BACK_MAX * 0.85 ? "#d29922" : "hsl(var(--muted-foreground))" }}>
                {back.length}/{BACK_MAX}
              </span>
            </div>
          </div>

          {/* Code example */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Python Example{" "}
                <span style={{ fontWeight: 400, textTransform: "none", color: "hsl(var(--muted-foreground))" }}>
                  (optional)
                </span>
              </label>
              <button
                type="button"
                onClick={() => { setShowCode((s) => !s); if (showCode) setCodeExample(""); }}
                className="flex items-center gap-1.5 text-xs transition-all duration-200"
                style={{ color: showCode ? "#ff6e6e" : "#58a6ff" }}
              >
                {showCode ? <><X size={12} /> Remove</> : <><Plus size={12} /><Code size={12} /> Add code</>}
              </button>
            </div>
            {showCode && <CodeEditor value={codeExample} onChange={setCodeExample} />}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: "hsl(var(--surface-2))",
                border:     "1px solid hsl(var(--border))",
                color:      "hsl(var(--muted-foreground))",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isValid ? "hsl(var(--primary))" : "hsl(var(--surface-2))",
                color:      isValid ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                border:     isValid ? "none" : "1px solid hsl(var(--border))",
              }}
            >
              <CheckCircle2 size={15} />
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
