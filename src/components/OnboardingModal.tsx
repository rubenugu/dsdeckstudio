import { useState, useEffect } from "react";
import {
  Layers, BookOpen, BarChart2, ChevronRight, X, Check,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";

const STEP_DEFS = [
  { id: 1, emoji: "📚", titleKey: "Your Cards",          nav: "all-cards", highlightKey: "All Cards",  icon: Layers,   descKey: "onboard_step1_desc" as const },
  { id: 2, emoji: "🧠", titleKey: "Study with Science",  nav: "study",     highlightKey: "Study",      icon: BookOpen, descKey: "onboard_step2_desc" as const },
  { id: 3, emoji: "📊", titleKey: "Track Your Progress", nav: "dashboard", highlightKey: "Dashboard",  icon: BarChart2, descKey: "onboard_step3_desc" as const },
];

const STORAGE_KEY = "dsdeck_onboarded";

export function OnboardingModal() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);
  const [closing, setClosing] = useState(false);

  const STEPS = STEP_DEFS.map((s) => ({ ...s, description: t(s.descKey, lang) }));

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // small delay so the app renders first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, "1");
    }, 220);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{
        background:     "hsl(0 0% 0% / 0.65)",
        backdropFilter: "blur(6px)",
        opacity:        closing ? 0 : 1,
        transition:     "opacity 0.22s ease",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background:  "hsl(var(--surface))",
          border:      "1px solid hsl(var(--border))",
          boxShadow:   "0 32px 80px hsl(0 0% 0% / 0.65), 0 0 0 1px hsl(var(--primary) / 0.08)",
          transform:   closing ? "scale(0.96)" : "scale(1)",
          transition:  "transform 0.22s ease",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "hsl(var(--primary))" }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}
            >
              <Layers size={14} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              🧠 DS Deck
            </span>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-md transition-all duration-200"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--surface-2))")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <X size={15} />
          </button>
        </div>

        {/* Step content */}
        <div className="p-6 space-y-5">
          {/* Emoji + heading */}
          <div className="text-center space-y-2">
            <div className="text-5xl">{current.emoji}</div>
            <h2 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {current.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {current.description}
            </p>
          </div>

          {/* Sample cards note — only on step 1 (Your Cards) */}
          {step === 0 && (
            <div
              className="flex items-start gap-2.5 p-3 rounded-lg text-xs leading-relaxed"
              style={{
                background: "hsl(var(--warning) / 0.08)",
                border:     "1px solid hsl(var(--warning) / 0.25)",
                color:      "hsl(var(--muted-foreground))",
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1 }}>💡</span>
              <span>{t("onboard_sample_note", lang)}</span>
            </div>
          )}

          {/* Highlight card */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{
              background: "hsl(var(--primary) / 0.07)",
              border:     "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <current.icon size={16} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
            <span className="text-sm font-medium" style={{ color: "hsl(var(--primary))" }}>
              Find it in the sidebar → <strong>{current.highlight}</strong>
            </span>
          </div>
        </div>

        {/* Step dots + CTA */}
        <div
          className="flex items-center justify-between px-6 pb-6"
        >
          {/* Dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width:      i === step ? 20 : 8,
                  height:     8,
                  background: i === step
                    ? "hsl(var(--primary))"
                    : i < step
                    ? "hsl(var(--primary) / 0.4)"
                    : "hsl(var(--border))",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: "hsl(var(--surface-2))",
                  border:     "1px solid hsl(var(--border))",
                  color:      "hsl(var(--muted-foreground))",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: "hsl(var(--primary))",
                color:      "hsl(var(--primary-foreground))",
              }}
            >
              {step < STEPS.length - 1 ? (
                <>Next <ChevronRight size={14} /></>
              ) : (
                <>Get started <Check size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
