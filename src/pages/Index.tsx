import { useState, useEffect } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ToastNotifier } from "@/components/ToastNotifier";
import { Toaster } from "@/components/ui/toaster";
import { DashboardPage } from "./DashboardPage";
import { StudyPage } from "./StudyPage";
import { AllCardsPage } from "./AllCardsPage";
import { AddCardPage } from "./AddCardPage";
import { SettingsPage } from "./SettingsPage";
import { QuickQuizPage } from "./QuickQuizPage";
import { AuthPage } from "./AuthPage";

const PAGE_COMPONENTS: Record<string, React.FC> = {
  dashboard:    DashboardPage,
  study:        StudyPage,
  "quick-quiz": QuickQuizPage,
  "all-cards":  AllCardsPage,
  "add-card":   AddCardPage,
  settings:     SettingsPage,
};

function AnimatedPage({ navKey }: { navKey: string }) {
  const [visible, setVisible]   = useState(false);
  const [renderKey, setRenderKey] = useState(navKey);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => { setRenderKey(navKey); setVisible(true); }, 80);
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

/** Keeps Supabase in sync and persists streak/settings changes */
function SyncLayer() {
  const { user } = useAuth();
  const store = useDeckStore();
  const { upsertSettings } = useSupabaseSync();

  // Persist streak changes to Supabase
  useEffect(() => {
    if (!user) return;
    upsertSettings({ streak: store.streak, lastStudyDate: store.lastStudyDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.streak]);

  return null;
}

const Index = () => {
  const { activeNav } = useDeckStore();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Apply persisted theme on boot
  useEffect(() => {
    const saved = localStorage.getItem("dsdeck_theme");
    if (saved === "light") document.documentElement.classList.add("light-mode");
  }, []);

  // Global Cmd+K / Ctrl+K
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

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
          Loading…
        </div>
      </div>
    );
  }

  // Not logged in → show auth page
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      <SyncLayer />
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

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <OnboardingModal />
      <ToastNotifier />
      <Toaster />
    </div>
  );
};

export default Index;
