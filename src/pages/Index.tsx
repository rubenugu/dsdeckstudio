import { useState, useEffect } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { DashboardPage } from "./DashboardPage";
import { StudyPage } from "./StudyPage";
import { AllCardsPage } from "./AllCardsPage";
import { AddCardPage } from "./AddCardPage";
import { SettingsPage } from "./SettingsPage";
import { QuickQuizPage } from "./QuickQuizPage";

const PAGE_COMPONENTS: Record<string, React.FC> = {
  dashboard:   DashboardPage,
  study:       StudyPage,
  "quick-quiz": QuickQuizPage,
  "all-cards":  AllCardsPage,
  "add-card":   AddCardPage,
  settings:    SettingsPage,
};

function AnimatedPage({ navKey }: { navKey: string }) {
  const [visible, setVisible] = useState(false);
  const [renderKey, setRenderKey] = useState(navKey);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setRenderKey(navKey);
      setVisible(true);
    }, 80);
    return () => clearTimeout(t);
  }, [navKey]);

  useEffect(() => { setVisible(true); }, []);

  const PageComponent = PAGE_COMPONENTS[renderKey] ?? DashboardPage;

  return (
    <div
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateX(0)" : "translateX(12px)",
        transition: "opacity 0.18s ease, transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        height: "100%",
      }}
    >
      <PageComponent />
    </div>
  );
}

const Index = () => {
  const { activeNav } = useDeckStore();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      <TopBar
        onMenuClick={() => setMobileOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          <AnimatedPage navKey={activeNav} />
        </main>
      </div>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default Index;
