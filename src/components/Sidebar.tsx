import {
  LayoutDashboard, BookOpen, Library, PlusSquare, Settings, Zap, X,
} from "lucide-react";
import { useDeckStore } from "@/store/useDeckStore";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";

const NAV_IDS = [
  { id: "dashboard",  key: "nav_dashboard",  Icon: LayoutDashboard },
  { id: "study",      key: "nav_study",      Icon: BookOpen },
  { id: "quick-quiz", key: "nav_quick_quiz", Icon: Zap },
  { id: "all-cards",  key: "nav_all_cards",  Icon: Library },
  { id: "add-card",   key: "nav_add_card",   Icon: PlusSquare },
  { id: "settings",   key: "nav_settings",   Icon: Settings },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { activeNav, setActiveNav } = useDeckStore();
  const { lang } = useLang();

  function handleNav(id: string) {
    setActiveNav(id);
    onMobileClose?.();
  }

  const content = (
    <aside
      className="w-60 shrink-0 flex flex-col border-r h-full"
      style={{ background: "hsl(var(--sidebar-background))", borderColor: "hsl(var(--border))" }}
    >
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
          {lang === "es" ? "Navegación" : "Navigation"}
        </span>
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden p-1 rounded transition-colors duration-200" style={{ color: "hsl(var(--muted-foreground))" }}>
            <X size={14} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_IDS.map(({ id, key, Icon }) => {
          const isActive   = activeNav === id;
          const isQuiz     = id === "quick-quiz";
          const activeColor = isQuiz ? "hsl(var(--warning))" : "#58a6ff";
          const activeBg    = isQuiz ? "hsl(var(--warning) / 0.10)" : "hsl(212 100% 68% / 0.10)";

          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className="group flex items-center gap-3 w-full text-left rounded-md transition-all duration-200 py-2 pr-3"
              style={
                isActive
                  ? { background: activeBg, color: activeColor, borderLeft: `2.5px solid ${activeColor}`, paddingLeft: "10px" }
                  : { paddingLeft: "12px", color: "hsl(var(--muted-foreground))", borderLeft: "2.5px solid transparent" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#21262d";
                  (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--foreground))";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))";
                }
              }}
            >
              <Icon size={16} style={{ color: isActive ? activeColor : undefined, flexShrink: 0, transition: "color 200ms ease" }} />
              <span className="text-sm font-medium">{t(key, lang)}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4">
        <span className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          v1.0 · ds-deck
        </span>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-full">{content}</div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 animate-fade-in" style={{ background: "hsl(0 0% 0% / 0.6)" }} onClick={onMobileClose} />
          <div className="relative z-10 h-full animate-slide-in-left">{content}</div>
        </div>
      )}
    </>
  );
}
