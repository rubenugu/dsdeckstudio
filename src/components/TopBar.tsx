import { useDeckStore } from "@/store/useDeckStore";
import { Layers } from "lucide-react";

export function TopBar() {
  const { cards, streak } = useDeckStore();

  return (
    <header
      className="h-14 flex items-center justify-between px-6 border-b"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--surface))" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}
        >
          <Layers size={15} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <span className="text-sm font-semibold tracking-wide" style={{ color: "hsl(var(--foreground))" }}>
          DS <span style={{ color: "hsl(var(--primary))" }}>Deck</span>
        </span>
      </div>

      {/* Right — streak + card count */}
      <div className="flex items-center gap-3">
        {/* Streak */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            background: "hsl(var(--warning) / 0.12)",
            border: "1px solid hsl(var(--warning) / 0.25)",
            color: "hsl(var(--warning))",
          }}
        >
          <span>🔥</span>
          <span className="font-mono">{streak}</span>
          <span className="opacity-80">day streak</span>
        </div>

        {/* Card count */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.25)",
            color: "hsl(var(--primary))",
          }}
        >
          <Layers size={12} />
          <span className="font-mono">{cards.length}</span>
          <span className="opacity-80">cards</span>
        </div>
      </div>
    </header>
  );
}
