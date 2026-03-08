import {
  LayoutDashboard,
  BookOpen,
  Library,
  PlusSquare,
  Settings,
} from "lucide-react";
import { useDeckStore } from "@/store/useDeckStore";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "study",     label: "Study",     Icon: BookOpen },
  { id: "all-cards", label: "All Cards", Icon: Library },
  { id: "add-card",  label: "Add Card",  Icon: PlusSquare },
  { id: "settings",  label: "Settings",  Icon: Settings },
];

export function Sidebar() {
  const { activeNav, setActiveNav } = useDeckStore();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col border-r h-full"
      style={{
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Nav section label */}
      <div className="px-4 pt-5 pb-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className="nav-item w-full text-left"
              style={
                isActive
                  ? {
                      background: "hsl(var(--primary) / 0.12)",
                      color: "hsl(var(--primary))",
                      borderLeft: "2px solid hsl(var(--primary))",
                      paddingLeft: "10px",
                    }
                  : {}
              }
            >
              <Icon size={16} />
              <span>{label}</span>
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
          v0.1.0 · ds-deck
        </span>
      </div>
    </aside>
  );
}
