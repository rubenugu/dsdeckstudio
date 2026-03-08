import { useState, useEffect } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";
import { Layers, Menu, Search, LogOut, RefreshCw } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
  onSearchOpen?: () => void;
}

export function TopBar({ onMenuClick, onSearchOpen }: TopBarProps) {
  const { cards, streak } = useDeckStore();
  const { user, signOut } = useAuth();
  const { syncing }       = useSupabaseSync();

  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  return (
    <header
      className="h-14 flex items-center justify-between px-4 md:px-6 border-b shrink-0"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--surface))" }}
    >
      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md transition-all duration-200"
          style={{ color: "hsl(var(--muted-foreground))" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#21262d")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}
          >
            <Layers size={15} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide" style={{ color: "hsl(var(--foreground))" }}>
              🧠 DS <span style={{ color: "hsl(var(--primary))" }}>Deck</span>
            </span>
            <span
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
              style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Center: search trigger */}
      <button
        onClick={onSearchOpen}
        className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm flex-1 max-w-xs mx-6 transition-all duration-200"
        style={{
          background: "hsl(var(--surface-2))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--muted-foreground))",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--primary) / 0.4)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border))"; }}
      >
        <Search size={13} />
        <span className="flex-1 text-left text-xs">Search cards…</span>
        <kbd
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
        >
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={onSearchOpen}
        className="md:hidden p-1.5 rounded-md transition-all duration-200"
        style={{ color: "hsl(var(--muted-foreground))" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#21262d")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
      >
        <Search size={17} />
      </button>

      {/* Right — sync + streak + cards + user */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Sync indicator */}
        {syncing && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
            title="Syncing…"
          >
            <RefreshCw size={11} className="animate-spin" />
            <span className="hidden sm:inline text-[11px]">Syncing</span>
          </div>
        )}

        <div
          className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-md text-xs font-medium"
          style={{ background: "hsl(var(--warning) / 0.12)", border: "1px solid hsl(var(--warning) / 0.25)", color: "hsl(var(--warning))" }}
        >
          <span>🔥</span>
          <span className="font-mono">{streak}</span>
          <span className="opacity-80 hidden sm:inline">day streak</span>
        </div>

        <div
          className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-md text-xs font-medium"
          style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)", color: "hsl(var(--primary))" }}
        >
          <Layers size={12} />
          <span className="font-mono">{cards.length}</span>
          <span className="opacity-80 hidden sm:inline">cards</span>
        </div>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-1.5 pl-2 border-l" style={{ borderColor: "hsl(var(--border))" }}>
            <span
              className="hidden sm:inline text-xs max-w-[100px] truncate"
              style={{ color: "hsl(var(--muted-foreground))" }}
              title={user.email}
            >
              {user.email}
            </span>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-md transition-all duration-200"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--destructive))"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))"; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
