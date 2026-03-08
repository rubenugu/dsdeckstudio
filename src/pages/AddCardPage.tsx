import { useState } from "react";
import { useDeckStore, type Category, type Difficulty } from "@/store/useDeckStore";
import { PlusCircle, CheckCircle2 } from "lucide-react";

const CATEGORIES: Category[] = ["Python", "Statistics", "ML", "Deep Learning", "SQL", "Data Engineering", "Other"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const diffColor: Record<Difficulty, string> = {
  easy: "hsl(var(--success))",
  medium: "hsl(var(--warning))",
  hard: "hsl(var(--destructive))",
};

export function AddCardPage() {
  const { addCard } = useDeckStore();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<Category>("Python");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    addCard({
      question: question.trim(),
      answer: answer.trim(),
      category,
      difficulty,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setQuestion("");
    setAnswer("");
    setTags("");
    setDifficulty("medium");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const labelStyle = {
    color: "hsl(var(--muted-foreground))",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontWeight: 600,
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
          {/* Question */}
          <div className="space-y-1.5">
            <label style={labelStyle}>Question</label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the curse of dimensionality?"
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
            />
          </div>

          {/* Answer */}
          <div className="space-y-1.5">
            <label style={labelStyle}>Answer</label>
            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Supports multi-line text and code snippets..."
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
            />
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "hsl(var(--surface))" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
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
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label style={labelStyle}>Tags <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400, textTransform: "none" }}>(comma separated)</span></label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. regression, sklearn, numpy"
              style={{ ...inputStyle }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!question.trim() || !answer.trim()}
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
              <>
                <CheckCircle2 size={15} />
                Card saved!
              </>
            ) : (
              <>
                <PlusCircle size={15} />
                Add Card
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
