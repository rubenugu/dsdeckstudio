import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

// VS Code dark+ theme colours, hand-tuned to match the DS Deck terminal aesthetic
const vscDark = {
  'code[class*="language-"]': {
    color: "#d4d4d4",
    background: "none",
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: "0.78rem",
    lineHeight: "1.7",
    textShadow: "none",
  },
  'pre[class*="language-"]': {
    color: "#d4d4d4",
    background: "#0d1117",
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: "0.78rem",
    lineHeight: "1.7",
    padding: "1rem",
    borderRadius: "6px",
    overflow: "auto",
    textShadow: "none",
  },
  comment:            { color: "#6a9955" },
  prolog:             { color: "#6a9955" },
  doctype:            { color: "#6a9955" },
  cdata:              { color: "#6a9955" },
  punctuation:        { color: "#d4d4d4" },
  property:           { color: "#9cdcfe" },
  tag:                { color: "#569cd6" },
  boolean:            { color: "#569cd6" },
  number:             { color: "#b5cea8" },
  constant:           { color: "#9cdcfe" },
  symbol:             { color: "#b5cea8" },
  deleted:            { color: "#ce9178" },
  selector:           { color: "#d7ba7d" },
  "attr-name":        { color: "#9cdcfe" },
  string:             { color: "#ce9178" },
  char:               { color: "#ce9178" },
  builtin:            { color: "#4ec9b0" },
  operator:           { color: "#d4d4d4" },
  entity:             { color: "#569cd6" },
  url:                { color: "#ce9178" },
  "class-name":       { color: "#4ec9b0" },
  "attr-value":       { color: "#ce9178" },
  keyword:            { color: "#569cd6" },
  function:           { color: "#dcdcaa" },
  regex:              { color: "#d16969" },
  important:          { color: "#569cd6" },
  variable:           { color: "#9cdcfe" },
  bold:               { fontWeight: "bold" },
  italic:             { fontStyle: "italic" },
  inserted:           { color: "#b5cea8" },
  "maybe-class-name": { color: "#4ec9b0" },
  "module-content":   { color: "#d4d4d4" },
};

interface SyntaxBlockProps {
  code: string;
  language?: string;
}

export function SyntaxBlock({ code, language = "python" }: SyntaxBlockProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))" }}
    >
      {/* Window chrome bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{
          background: "#161b22",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        <span
          className="ml-2 text-[10px] font-mono"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {language}.py
        </span>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDark as Record<string, React.CSSProperties>}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "#0d1117",
          padding: "1rem",
          fontSize: "0.775rem",
          lineHeight: "1.7",
          maxHeight: "360px",
          overflowY: "auto",
        }}
        showLineNumbers
        lineNumberStyle={{
          color: "#3b4045",
          minWidth: "2em",
          paddingRight: "1em",
          userSelect: "none",
        }}
        wrapLongLines={false}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
