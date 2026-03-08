import {
  LayoutDashboard,
  BookOpen,
  Library,
  PlusSquare,
  Settings,
  X,
} from "lucide-react";
import { useDeckStore } from "@/store/useDeckStore";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "study",     label: "Study",     Icon: BookOpen },
  { id: "all-cards", label: "All Cards", Icon: Library },
  { id: "add-card",  label: "Add Card",  Icon: PlusSquare },
  { id: "settings",  label: "Settings",  Icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { activeNav, setActiveNav } = useDeckStore();

  function handleNav(id: string) {
    setActiveNav(id);
    onMobileClose?.();
  }

  const content = (
    <aside
      className="w-60 shrink-0 flex flex-col border-r h-full"
      style={{
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Nav section label + mobile close */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Navigation
        </span>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 rounded transition-colors duration-200"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className="group flex items-center gap-3 w-full text-left rounded-md transition-all duration-200 py-2 pr-3"
              style={
                isActive
                  ? {
                      background: "hsl(212 100% 68% / 0.10)",
                      color: "#58a6ff",
                      borderLeft: "2.5px solid #58a6ff",
                      paddingLeft: "10px",
                    }
                  : {
                      paddingLeft: "12px",
                      color: "hsl(var(--muted-foreground))",
                      borderLeft: "2.5px solid transparent",
                    }
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
              <Icon
                size={16}
                style={{
                  color: isActive ? "#58a6ff" : undefined,
                  flexShrink: 0,
                  transition: "color 200ms ease",
                }}
              />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer version tag */}
      <div className="px-4 py-4">
        <span
          className="text-[10px] font-mono"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          v1.0 · ds-deck
        </span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{content}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 animate-fade-in"
            style={{ background: "hsl(0 0% 0% / 0.6)" }}
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full animate-slide-in-left">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
