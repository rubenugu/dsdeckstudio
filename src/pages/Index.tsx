import { useDeckStore } from "@/store/useDeckStore";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { DashboardPage } from "./DashboardPage";
import { StudyPage } from "./StudyPage";
import { AllCardsPage } from "./AllCardsPage";
import { AddCardPage } from "./AddCardPage";
import { SettingsPage } from "./SettingsPage";

const PAGE_MAP: Record<string, React.ReactNode> = {
  dashboard: <DashboardPage />,
  study: <StudyPage />,
  "all-cards": <AllCardsPage />,
  "add-card": <AddCardPage />,
  settings: <SettingsPage />,
};

const Index = () => {
  const { activeNav } = useDeckStore();

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Top bar */}
      <TopBar />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {PAGE_MAP[activeNav] ?? <DashboardPage />}
        </main>
      </div>
    </div>
  );
};

export default Index;
