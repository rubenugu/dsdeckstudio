import { useDeckStore } from "@/store/useDeckStore";
import { Layers, Menu } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { cards, streak } = useDeckStore();

  return (
    <header
      className="h-14 flex items-center justify-between px-4 md:px-6 border-b shrink-0"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--surface))" }}
    >
      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md transition-all duration-200"
          style={{ color: "hsl(var(--muted-foreground))" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#21262d")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <Menu size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: "hsl(var(--primary) / 0.15)",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <Layers size={15} style={{ color: "hsl(var(--primary))" }} />
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold tracking-wide"
              style={{ color: "hsl(var(--foreground))" }}
            >
              🧠 DS <span style={{ color: "hsl(var(--primary))" }}>Deck</span>
            </span>
            {/* Version badge */}
            <span
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
              style={{
                background: "hsl(var(--surface-2))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Right — streak + card count */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Streak */}
        <div
          className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            background: "hsl(var(--warning) / 0.12)",
            border: "1px solid hsl(var(--warning) / 0.25)",
            color: "hsl(var(--warning))",
          }}
        >
          <span>🔥</span>
          <span className="font-mono">{streak}</span>
          <span className="opacity-80 hidden sm:inline">day streak</span>
        </div>

        {/* Card count */}
        <div
          className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.25)",
            color: "hsl(var(--primary))",
          }}
        >
          <Layers size={12} />
          <span className="font-mono">{cards.length}</span>
          <span className="opacity-80 hidden sm:inline">cards</span>
        </div>
      </div>
    </header>
  );
}
