import React, { useMemo } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { useLang } from "@/contexts/LanguageContext";
import { t } from "@/i18n/translations";
import { Flame, BookMarked, Clock, CalendarDays, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { getDueCards } from "@/utils/sm2";

// ── Category colors ────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Statistics":          "hsl(212 100% 68%)",
  "Machine Learning":    "hsl(133 57% 58%)",
  "Deep Learning":       "hsl(291 65% 65%)",
  "Python & Libraries":  "hsl(40 77% 58%)",
  "Data Wrangling":      "hsl(15 75% 60%)",
  "Data Visualization":  "hsl(186 75% 55%)",
  "SQL & Databases":     "hsl(354 70% 60%)",
  "Feature Engineering": "hsl(260 60% 65%)",
  "Model Evaluation":    "hsl(160 57% 55%)",
  "MLOps":               "hsl(200 80% 60%)",
};

// ── Heatmap helpers ────────────────────────────────────────────────────────────
function getHeatColor(count: number): string {
  if (count === 0) return "#161b22";
  if (count <= 5) return "#0e4429";
  if (count <= 15) return "#006d32";
  if (count <= 30) return "#26a641";
  return "#39d353";
}

function buildHeatmapData(cards: ReturnType<typeof useDeckStore.getState>["cards"]) {
  const map: Record<string, number> = {};
  for (const c of cards) {
    if (!c.lastReviewed) continue;
    const key = new Date(c.lastReviewed).toDateString();
    map[key] = (map[key] || 0) + 1;
  }
  return map;
}

function buildHeatmapGrid(reviewMap: Record<string, number>) {
  // 13 weeks × 7 days = 91 days back
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: Date; count: number }[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d, count: reviewMap[d.toDateString()] ?? 0 });
  }
  // Pad front to start on Sunday
  const firstDow = days[0].date.getDay(); // 0=Sun
  const padded: ({ date: Date; count: number } | null)[] = [
    ...Array(firstDow).fill(null),
    ...days,
  ];
  // Split into weeks (columns)
  const weeks: (({ date: Date; count: number } | null)[])[] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-3 py-2 text-xs"
      style={{
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--foreground))",
      }}
    >
      <p style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      <p className="font-semibold font-mono mt-0.5">{payload[0].value}</p>
    </div>
  );
}

// ── Hero stat card ─────────────────────────────────────────────────────────────
function HeroCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="ds-card p-5 flex flex-col gap-3 relative overflow-hidden"
    >
      {/* glow accent */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}, transparent 70%)` }}
      />
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
        <p className="text-3xl font-bold font-mono leading-none" style={{ color: "hsl(var(--foreground))" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { cards, streak, studySessions } = useDeckStore();
  const { lang } = useLang();

  // ── Hero stats ──────────────────────────────────────────────────────────────
  const mastered = cards.filter((c) => c.interval > 21).length;
  const dueToday  = getDueCards(cards).length;

  // ── Heatmap ─────────────────────────────────────────────────────────────────
  const reviewMap = useMemo(() => buildHeatmapData(cards), [cards]);
  const heatGrid  = useMemo(() => buildHeatmapGrid(reviewMap), [reviewMap]);

  // Month labels: find first cell per month
  const monthLabels = useMemo(() => {
    const labels: { col: number; month: string }[] = [];
    let lastMonth = -1;
    heatGrid.forEach((week, ci) => {
      const firstReal = week.find((d) => d !== null);
      if (firstReal) {
        const m = firstReal.date.getMonth();
        if (m !== lastMonth) { labels.push({ col: ci, month: MONTHS[m] }); lastMonth = m; }
      }
    });
    return labels;
  }, [heatGrid]);

  // ── Category mastery ────────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; mastered: number }> = {};
    for (const c of cards) {
      if (!map[c.category]) map[c.category] = { total: 0, mastered: 0 };
      map[c.category].total++;
      if (c.interval > 21) map[c.category].mastered++;
    }
    return Object.entries(map)
      .map(([cat, { total, mastered }]) => ({
        name: cat,
        total,
        mastered,
        pct: total > 0 ? Math.round((mastered / total) * 100) : 0,
        color: CATEGORY_COLORS[cat] ?? "hsl(var(--primary))",
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [cards]);

  // ── Due timeline (next 14 days) ─────────────────────────────────────────────
  const dueTimeline = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { day: string; due: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const due = cards.filter((c) => {
        if (!c.nextReview) return i === 0;
        const nr = new Date(c.nextReview);
        return nr >= d && nr < next;
      }).length;
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `+${i}d`;
      days.push({ day: label, due });
    }
    return days;
  }, [cards]);

  // ── Recent activity ─────────────────────────────────────────────────────────
  const recentSessions = useMemo(
    () => (studySessions ?? []).slice(-5).reverse(),
    [studySessions]
  );

  return (
    <div className="p-5 md:p-7 space-y-6 animate-page-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          Control Room
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Your DS Deck overview · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── 1. Hero Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HeroCard
          icon={Flame}
          label="Current Streak"
          value={`${streak} days`}
          sub="Keep it going 🔥"
          color="hsl(40 77% 58%)"
        />
        <HeroCard
          icon={BookMarked}
          label="Cards Mastered"
          value={mastered}
          sub={`${cards.length - mastered} still in progress`}
          color="hsl(133 57% 58%)"
        />
        <HeroCard
          icon={Clock}
          label="Due Today"
          value={dueToday}
          sub={dueToday > 0 ? "Time to review!" : "All caught up ✓"}
          color={dueToday > 0 ? "hsl(354 70% 60%)" : "hsl(133 57% 58%)"}
        />
      </div>

      {/* ── 2. Heatmap ─────────────────────────────────────────────────────── */}
      <div className="ds-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
            <CalendarDays size={14} style={{ color: "hsl(var(--primary))" }} />
            Study Activity
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>Less</span>
            {["#161b22","#0e4429","#006d32","#26a641","#39d353"].map((c) => (
              <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c, border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          {/* Month labels row */}
          <div className="flex gap-[3px] mb-1 ml-8">
            {heatGrid.map((_, ci) => {
              const lbl = monthLabels.find((m) => m.col === ci);
              return (
                <div key={ci} className="w-3 text-[9px] leading-none shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {lbl?.month ?? ""}
                </div>
              );
            })}
          </div>

          {/* Grid: DOW rows × week columns */}
          <div className="flex gap-1">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {DOW_LABELS.map((d, i) => (
                <div
                  key={d}
                  className="w-6 h-3 flex items-center text-[9px] leading-none shrink-0"
                  style={{ color: i % 2 === 0 ? "transparent" : "hsl(var(--muted-foreground))" }}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Cells */}
            {heatGrid.map((week, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {Array(7).fill(null).map((_, ri) => {
                  const cell = week[ri];
                  return (
                    <div
                      key={ri}
                      title={cell ? `${cell.date.toDateString()}: ${cell.count} reviews` : ""}
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{
                        background: cell ? getHeatColor(cell.count) : "transparent",
                        border: cell ? "1px solid rgba(255,255,255,0.06)" : "none",
                        cursor: cell ? "default" : "default",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3 + 4. Charts row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 3. Category Mastery */}
        <div className="ds-card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
            <Activity size={14} style={{ color: "hsl(var(--primary))" }} />
            Category Mastery
          </h2>
          <div className="space-y-3">
            {categoryStats.map(({ name, mastered: m, total, pct, color }) => (
              <div key={name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs truncate pr-2 max-w-[180px]" style={{ color: "hsl(var(--foreground))" }}>
                    {name}
                  </span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {m}/{total} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-2))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Cards Due Timeline */}
        <div className="ds-card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
            <CalendarDays size={14} style={{ color: "hsl(var(--primary))" }} />
            Due in Next 14 Days
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dueTimeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="due"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 5. Recent Activity ─────────────────────────────────────────────── */}
      <div className="ds-card p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
          <Activity size={14} style={{ color: "hsl(var(--primary))" }} />
          Recent Study Sessions
        </h2>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No sessions yet — start studying to see your history here.
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid grid-cols-4 text-[10px] font-medium uppercase tracking-wide pb-2 mb-1"
              style={{
                color: "hsl(var(--muted-foreground))",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <span>Date</span>
              <span className="text-right">Reviewed</span>
              <span className="text-right">Accuracy</span>
              <span className="text-right">Time</span>
            </div>

            <div className="space-y-0.5">
              {recentSessions.map((s, i) => {
                const d = new Date(s.date);
                const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                const mins = Math.floor(s.durationSec / 60);
                const secs = s.durationSec % 60;
                return (
                  <div
                    key={i}
                    className="grid grid-cols-4 py-2 text-xs"
                    style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
                  >
                    <div>
                      <p style={{ color: "hsl(var(--foreground))" }}>{dateStr}</p>
                      <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{timeStr}</p>
                    </div>
                    <p className="text-right font-mono" style={{ color: "hsl(var(--foreground))" }}>
                      {s.reviewed}
                    </p>
                    <p
                      className="text-right font-mono font-semibold"
                      style={{ color: s.accuracy >= 70 ? "hsl(var(--success))" : "hsl(var(--warning))" }}
                    >
                      {s.accuracy}%
                    </p>
                    <p className="text-right font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {mins}m {secs}s
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
