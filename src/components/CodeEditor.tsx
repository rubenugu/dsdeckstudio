import { useRef } from "react";
import { Code } from "lucide-react";

export function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef  = useRef<HTMLDivElement>(null);
  const lineCount   = value ? value.split("\n").length : 1;

  function syncScroll() {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta    = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newVal = value.substring(0, start) + "    " + value.substring(end);
      onChange(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; }, 0);
    }
  }

  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: "#161b22", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <Code size={12} style={{ color: "#58a6ff" }} />
        <span className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          python · {lineCount} line{lineCount !== 1 ? "s" : ""}
        </span>
        <span className="ml-auto text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          Tab=4sp
        </span>
      </div>

      <div className="flex" style={{ background: "#0d1117", maxHeight: 280, overflow: "hidden" }}>
        {/* Line numbers */}
        <div
          ref={lineNumRef}
          className="select-none overflow-hidden shrink-0"
          style={{
            color:        "#3b4045",
            fontFamily:   "JetBrains Mono, monospace",
            fontSize:     "12px",
            lineHeight:   "1.7",
            padding:      "12px 8px 12px 12px",
            textAlign:    "right",
            borderRight:  "1px solid hsl(var(--border))",
            minWidth:     "3rem",
            overflowY:    "hidden",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          placeholder={"# Paste or type a runnable Python snippet…\nimport pandas as pd\n\ndf = pd.read_csv('data.csv')\ndf.head()"}
          rows={10}
          spellCheck={false}
          className="flex-1 outline-none resize-none bg-transparent"
          style={{
            color:       "#d4d4d4",
            fontFamily:  "JetBrains Mono, monospace",
            fontSize:    "12px",
            lineHeight:  "1.7",
            padding:     "12px",
            overflowY:   "auto",
          }}
        />
      </div>
    </div>
  );
}
