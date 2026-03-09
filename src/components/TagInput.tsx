import { useState } from "react";
import { X } from "lucide-react";

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  function addTag(val: string) {
    const trimmed = val.trim().toLowerCase().replace(/\s+/g, "-");
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2.5 rounded-md min-h-[42px] transition-all duration-200"
      style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
      onClick={() => document.getElementById("tag-input")?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono"
          style={{
            background: "hsl(var(--primary) / 0.12)",
            color:      "hsl(var(--primary))",
            border:     "1px solid hsl(var(--primary) / 0.25)",
          }}
        >
          #{tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
            style={{ color: "hsl(var(--primary))", opacity: 0.7 }}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        id="tag-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input) addTag(input); }}
        placeholder={tags.length === 0 ? "Type a tag and press Enter…" : ""}
        className="bg-transparent text-xs outline-none flex-1 min-w-24"
        style={{ color: "hsl(var(--foreground))" }}
      />
    </div>
  );
}
