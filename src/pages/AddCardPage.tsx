import { useState } from "react";
import { useDeckStore, DS_CATEGORIES, type DSCategory, type Difficulty } from "@/store/useDeckStore";
import { PlusCircle, CheckCircle2, Code } from "lucide-react";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

const diffColor: Record<Difficulty, string> = {
  beginner: "hsl(var(--success))",
  intermediate: "hsl(var(--warning))",
  advanced: "hsl(var(--destructive))",
};

export function AddCardPage() {
  const { addCard } = useDeckStore();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [codeExample, setCodeExample] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [category, setCategory] = useState<DSCategory>("Machine Learning");
  const [subcategory, setSubcategory] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [tags, setTags] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    addCard({
      front: front.trim(),
      back: back.trim(),
      codeExample: codeExample.trim() || undefined,
      category,
      subcategory: subcategory.trim() || category,
      difficulty,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setFront("");
    setBack("");
    setCodeExample("");
    setSubcategory("");
    setTags("");
    setShowCode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const labelStyle = {
    color: "hsl(var(--muted-foreground))",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontWeight: 600,
    display: "block" as const,
    marginBottom: "6px",
  };

  const inputStyle = {
    background: "hsl(var(--surface))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    borderRadius: "var(--radius)",
    fontSize: "13px",
    transition: "border-color 200ms ease",
    outline: "none",
    width: "100%",
    padding: "10px 12px",
  };

  const focus = (e: React.FocusEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary))");
  const blur = (e: React.FocusEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))");

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-xl">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
          Add Card
        </h1>
        <p className="text-sm mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
          Create a new flashcard for your deck
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Front */}
          <div>
            <label style={labelStyle}>Front — Question / Concept</label>
            <textarea
              rows={2}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. What is the curse of dimensionality?"
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              onFocus={focus}
              onBlur={blur}
            />
          </div>

          {/* Back */}
          <div>
            <label style={labelStyle}>Back — Answer / Explanation</label>
            <textarea
              rows={5}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Detailed answer, formulas, key points…"
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px",
              }}
              onFocus={focus}
              onBlur={blur}
            />
          </div>

          {/* Code example toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowCode((s) => !s)}
              className="flex items-center gap-2 text-xs transition-all duration-200 mb-3"
              style={{ color: showCode ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
            >
              <Code size={13} />
              {showCode ? "Remove code example" : "+ Add Python code example (optional)"}
            </button>
            {showCode && (
              <textarea
                rows={6}
                value={codeExample}
                onChange={(e) => setCodeExample(e.target.value)}
                placeholder="# Runnable Python snippet…"
                style={{
                  ...inputStyle,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  resize: "vertical",
                  color: "hsl(133, 57%, 70%)",
                  background: "hsl(215 14% 6%)",
                }}
                onFocus={focus}
                onBlur={blur}
              />
            )}
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DSCategory)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={focus}
                onBlur={blur}
              >
                {DS_CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "hsl(var(--surface))" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subcategory</label>
              <input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Hypothesis Testing"
                style={inputStyle}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label style={labelStyle}>Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className="flex-1 py-2 rounded-md text-xs font-medium capitalize transition-all duration-200"
                  style={
                    difficulty === d
                      ? {
                          background: `${diffColor[d]}18`,
                          color: diffColor[d],
                          border: `1px solid ${diffColor[d]}50`,
                        }
                      : {
                          background: "hsl(var(--surface))",
                          color: "hsl(var(--muted-foreground))",
                          border: "1px solid hsl(var(--border))",
                        }
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>
              Tags{" "}
              <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400, textTransform: "none" }}>
                (comma separated)
              </span>
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. regression, sklearn, numpy"
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!front.trim() || !back.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: saved ? "hsl(var(--success) / 0.15)" : "hsl(var(--primary) / 0.15)",
              color: saved ? "hsl(var(--success))" : "hsl(var(--primary))",
              border: saved
                ? "1px solid hsl(var(--success) / 0.35)"
                : "1px solid hsl(var(--primary) / 0.35)",
            }}
          >
            {saved ? (
              <><CheckCircle2 size={15} /> Card saved!</>
            ) : (
              <><PlusCircle size={15} /> Add Card</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
