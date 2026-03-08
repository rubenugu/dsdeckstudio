import { useState, useEffect, useRef } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { DashboardPage } from "./DashboardPage";
import { StudyPage } from "./StudyPage";
import { AllCardsPage } from "./AllCardsPage";
import { AddCardPage } from "./AddCardPage";
import { SettingsPage } from "./SettingsPage";

const PAGE_COMPONENTS: Record<string, React.FC> = {
  dashboard: DashboardPage,
  study: StudyPage,
  "all-cards": AllCardsPage,
  "add-card": AddCardPage,
  settings: SettingsPage,
};

const Index = () => {
  const { activeNav } = useDeckStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [animKey, setAnimKey] = useState(activeNav);
  const prevNav = useRef(activeNav);

  useEffect(() => {
    if (activeNav !== prevNav.current) {
      prevNav.current = activeNav;
      setAnimKey(activeNav);
    }
  }, [activeNav]);

  const PageComponent = PAGE_COMPONENTS[activeNav] ?? DashboardPage;

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Top bar */}
      <TopBar onMenuClick={() => setMobileOpen(true)} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar (always visible) */}
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main content with slide-in key animation */}
        <main
          key={animKey}
          className="flex-1 overflow-y-auto animate-page-in"
        >
          <PageComponent />
        </main>
      </div>
    </div>
  );
};

export default Index;
