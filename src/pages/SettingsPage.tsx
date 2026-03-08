import { useState, useEffect } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";
import { Sun, Moon, Trash2, FileDown, FileUp, Check, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const THEME_KEY = "dsdeck_theme";

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light-mode");
    root.classList.remove("dark-mode");
  } else {
    root.classList.remove("light-mode");
    root.classList.add("dark-mode");
  }
  localStorage.setItem(THEME_KEY, theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved as "dark" | "light") ?? "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(t: "dark" | "light") {
    setThemeState(t);
    applyTheme(t);
  }

  return { theme, setTheme };
}

export function SettingsPage() {
  const { cards, studySessions } = useDeckStore();
  const store = useDeckStore();
  const { theme, setTheme } = useTheme();
  const { upsertSettings, deleteCard: deleteCardRemote, upsertCard } = useSupabaseSync();
  const { lang, setLang } = useLang();

  const totalReps    = cards.reduce((s, c) => s + c.repetitions, 0);
  const avgEF        = cards.length > 0
    ? (cards.reduce((s, c) => s + c.easeFactor, 0) / cards.length).toFixed(2)
    : "–";
  const masteredCards = cards.filter((c) => c.interval > 21).length;
  const needsPractice = cards.filter((c) => {
    const recentLow = (c.quality ?? 5) <= 2 && c.repetitions >= 3;
    return recentLow;
  }).length;

  function handleThemeChange(t: "dark" | "light") {
    setTheme(t);
    upsertSettings({ theme: t });
  }

  function clearAll() {
    if (window.confirm("Delete ALL cards? This cannot be undone.")) {
      cards.forEach((c) => { store.deleteCard(c.id); deleteCardRemote(c.id); });
      toast({ title: "🗑 All cards deleted", duration: 3000 });
    }
  }

  function exportDeck() {
    const data = JSON.stringify({ cards, exportedAt: new Date().toISOString() }, null, 2);
    const blob  = new Blob([data], { type: "application/json" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = `dsdeck_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📦 Deck exported!", description: `${cards.length} cards saved.`, duration: 3000 });
  }

  function importDeck(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const imported = json.cards ?? json;
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        let count = 0;
        imported.forEach((c: any) => {
          if (c.front && c.back) {
            const newCard = store.addCard(c);
            upsertCard(newCard);
            count++;
          }
        });
        toast({ title: `✅ Imported ${count} cards!`, duration: 4000 });
      } catch {
        toast({ title: "❌ Import failed", description: "Invalid JSON format.", duration: 4000 });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {t("settings_title", lang)}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          {lang === "es" ? "Gestiona tu mazo y preferencias" : "Manage your deck and preferences"}
        </p>
      </div>

      <div className="max-w-lg space-y-4">

        {/* ── Language toggle ───────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
            <Globe size={14} style={{ color: "hsl(var(--primary))" }} />
            {t("settings_language", lang)}
          </h2>
          <div className="flex gap-2">
            {(["en", "es"] as const).map((l) => {
              const active = lang === l;
              return (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? "hsl(var(--primary) / 0.12)" : "hsl(var(--surface-2))",
                    border:     active ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
                    color:      active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <span>{l === "en" ? "🇬🇧" : "🇪🇸"}</span>
                  {l === "en" ? "English" : "Español"}
                  {active && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Theme toggle ─────────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {t("settings_theme", lang)}
          </h2>
          <div className="flex gap-2">
            {(["dark", "light"] as const).map((th) => {
              const active = theme === th;
              return (
                <button
                  key={th}
                  onClick={() => handleThemeChange(th)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? "hsl(var(--primary) / 0.12)" : "hsl(var(--surface-2))",
                    border:     active ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
                    color:      active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {th === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                  {th === "dark" ? t("settings_theme_dark", lang) : t("settings_theme_light", lang)}
                  {active && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Stats panel ──────────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Session Statistics
          </h2>
          {[
            ["Total cards",            cards.length],
            ["Total repetitions",      totalReps],
            ["Average ease factor",    avgEF],
            ["Mastered (interval > 21d)", masteredCards],
            ["Needs practice",         needsPractice],
            ["Study sessions logged",  (studySessions ?? []).length],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
              <span className="font-mono" style={{ color: "hsl(var(--foreground))" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* ── Export / Import ───────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Backup & Restore
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Export your deck as JSON to back up or share. Import to merge cards from a backup.
          </p>
          <div className="flex gap-2">
            <button
              onClick={exportDeck}
              disabled={cards.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-40"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                color:      "hsl(var(--primary))",
                border:     "1px solid hsl(var(--primary) / 0.3)",
              }}
            >
              <FileDown size={14} />
              Export JSON
            </button>
            <label
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: "hsl(var(--surface-2))",
                color:      "hsl(var(--muted-foreground))",
                border:     "1px solid hsl(var(--border))",
              }}
            >
              <Upload size={14} />
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={importDeck} />
            </label>
          </div>
        </div>

        {/* ── SM-2 info ──────────────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Spaced Repetition (SM-2)
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            DS Deck uses the{" "}
            <span className="font-mono" style={{ color: "hsl(var(--primary))" }}>SM-2</span> algorithm.
            Rate each card 0–5. Ratings ≥ 3 advance the interval; ratings &lt; 3 reset to day 1.
          </p>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { q: 0, label: "Blackout" }, { q: 2, label: "Hard" }, { q: 3, label: "Good" },
              { q: 4, label: "Great" },   { q: 5, label: "Easy" },
            ].map(({ q, label }) => (
              <div
                key={q}
                className="text-center py-1.5 rounded text-[10px]"
                style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
              >
                <div className="font-mono font-bold">{q}</div>
                <div>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Storage info ──────────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Storage
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            All data is persisted in{" "}
            <span className="terminal-block px-1.5 py-0.5 rounded inline font-mono" style={{ color: "hsl(var(--primary))" }}>
              localStorage
            </span>{" "}
            under{" "}
            <span className="terminal-block px-1.5 py-0.5 rounded inline font-mono" style={{ color: "hsl(var(--primary))" }}>
              dsdeck_cards
            </span>
            . Nothing leaves your browser.
          </p>
        </div>

        {/* ── Reset Study Progress ─────────────────────────────────────────── */}
        <div
          className="ds-card p-5 space-y-4"
          style={{ borderColor: "hsl(var(--destructive) / 0.25)" }}
        >
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "hsl(var(--destructive))" }}>
            ⚠️ {lang === "es" ? "Reiniciar Progreso de Estudio" : "Reset Study Progress"}
          </h2>

          {/* Reset Streak */}
          <div className="space-y-1.5">
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {lang === "es"
                ? "Reinicia tu racha a 0. Tus tarjetas y datos SM-2 permanecen intactos."
                : "Resets your current streak to 0. All cards and SM-2 review data remain intact."}
            </p>
            <button
              onClick={() => {
                if (window.confirm(t("confirm_reset_streak", lang))) {
                  store.resetStreak();
                  upsertSettings({ streak: 0, lastStudyDate: null });
                  toast({ title: lang === "es" ? "🔄 Racha reiniciada a 0" : "🔄 Streak reset to 0", duration: 3000 });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              style={{
                background: "hsl(var(--destructive) / 0.08)",
                color:      "hsl(var(--destructive))",
                border:     "1px solid hsl(var(--destructive) / 0.3)",
              }}
            >
              ⚠️ {t("settings_reset_streak", lang)}
            </button>
          </div>

          <div style={{ height: "1px", background: "hsl(var(--border))" }} />

          {/* Reset Review Schedule */}
          <div className="space-y-1.5">
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {lang === "es"
                ? "Reinicia nextReview, lastReviewed, repeticiones e intervalo en todas las tarjetas. El contenido permanece intacto."
                : "Clears nextReview, lastReviewed, repetitions, interval, and easeFactor on all cards. Card content stays intact."}
            </p>
            <button
              onClick={async () => {
                if (window.confirm(t("confirm_reset_progress", lang))) {
                  const resetCards = store.resetReviewSchedule();
                  await Promise.all(resetCards.map((c) => upsertCard(c)));
                  toast({
                    title: lang === "es" ? "🔄 Calendario de repaso reiniciado" : "🔄 Review schedule reset",
                    description: lang === "es"
                      ? `${resetCards.length} tarjetas listas para repasar.`
                      : `${resetCards.length} cards are now due immediately.`,
                    duration: 4000,
                  });
                }
              }}
              disabled={cards.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{
                background: "hsl(var(--destructive) / 0.08)",
                color:      "hsl(var(--destructive))",
                border:     "1px solid hsl(var(--destructive) / 0.3)",
              }}
            >
              ⚠️ {t("settings_reset_progress", lang)}
            </button>
          </div>
        </div>

        {/* ── Danger zone ───────────────────────────────────────────────────── */}
        <div
          className="ds-card p-5 space-y-3"
          style={{ borderColor: "hsl(var(--destructive) / 0.3)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--destructive))" }}>
            Danger Zone
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Permanently delete all {cards.length} card{cards.length !== 1 ? "s" : ""} and all review history.
          </p>
          <button
            onClick={clearAll}
            disabled={cards.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-30"
            style={{
              background: "hsl(var(--destructive) / 0.1)",
              color:      "hsl(var(--destructive))",
              border:     "1px solid hsl(var(--destructive) / 0.3)",
            }}
          >
            <Trash2 size={14} />
            Delete all cards
          </button>
        </div>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        <div className="ds-card p-5 space-y-1">
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            About
          </h2>
          <p className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>DS Deck · v1.0</p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            A minimal, spaced-repetition flashcard tracker for data scientists.
          </p>
        </div>
      </div>
    </div>
  );
}
