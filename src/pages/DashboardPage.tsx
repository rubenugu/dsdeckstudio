import { useDeckStore } from "@/store/useDeckStore";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="ds-card p-4 flex items-center gap-4 animate-fade-in">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {label}
        </p>
        <p
          className="text-xl font-semibold font-mono leading-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { cards, streak } = useDeckStore();

  const totalReviewed = cards.reduce((s, c) => s + c.repetitions, 0);
  const avgQuality =
    totalReviewed > 0
      ? (
          cards.reduce((s, c) => s + (c.quality ?? 0) * c.repetitions, 0) /
          totalReviewed
        ).toFixed(1)
      : "–";

  const accuracy =
    totalReviewed > 0
      ? Math.round(
          (cards.filter((c) => (c.quality ?? 0) >= 3).length / cards.length) * 100
        )
      : 0;

  const now = Date.now();
  const dueCards = cards.filter(
    (c) => !c.nextReview || new Date(c.nextReview).getTime() <= now
  );

  const categoryCount = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const withCode = cards.filter((c) => !!c.codeExample).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Your study overview at a glance
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={LayoutDashboard}
          label="Total Cards"
          value={cards.length}
          color="hsl(var(--primary))"
        />
        <StatCard
          icon={BookOpen}
          label="Total Reviews"
          value={totalReviewed}
          color="hsl(var(--success))"
        />
        <StatCard
          icon={BarChart2}
          label="Avg Quality"
          value={avgQuality}
          color="hsl(var(--warning))"
        />
        <StatCard
          icon={TrendingUp}
          label="Day Streak 🔥"
          value={streak}
          color="hsl(var(--warning))"
        />
      </div>

      {/* Due cards alert */}
      {dueCards.length > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg animate-fade-in"
          style={{
            background: "hsl(var(--warning) / 0.08)",
            border: "1px solid hsl(var(--warning) / 0.3)",
          }}
        >
          <AlertCircle size={16} style={{ color: "hsl(var(--warning))" }} />
          <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
            <span className="font-semibold font-mono" style={{ color: "hsl(var(--warning))" }}>
              {dueCards.length}
            </span>{" "}
            card{dueCards.length !== 1 ? "s" : ""} due for review today — SM-2 scheduled.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="ds-card p-5">
          <h2
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: "hsl(var(--foreground))" }}
          >
            <BarChart2 size={14} style={{ color: "hsl(var(--primary))" }} />
            Cards by Category
          </h2>
          <div className="space-y-2.5">
            {Object.entries(categoryCount)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const pct = Math.round((count / cards.length) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs truncate pr-2" style={{ color: "hsl(var(--foreground))" }}>
                        {cat}
                      </span>
                      <span className="text-xs font-mono shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {count}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "hsl(var(--surface-2))" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: "hsl(var(--primary))" }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recent cards */}
        <div className="ds-card p-5">
          <h2
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: "hsl(var(--foreground))" }}
          >
            <Clock size={14} style={{ color: "hsl(var(--primary))" }} />
            Recent Cards
          </h2>
          <div className="space-y-2">
            {[...cards]
              .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
              .slice(0, 5)
              .map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-2.5 py-1.5"
                  style={{ borderBottom: "1px solid hsl(var(--border))" }}
                >
                  {card.codeExample ? (
                    <Code size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={13} style={{ color: "hsl(var(--success))", flexShrink: 0 }} />
                  )}
                  <p className="text-xs truncate flex-1" style={{ color: "hsl(var(--foreground))" }}>
                    {card.front}
                  </p>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                    style={{
                      background: "hsl(var(--surface-2))",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {card.difficulty[0].toUpperCase()}
                  </span>
                </div>
              ))}
          </div>

          {/* Code coverage */}
          <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <Code size={12} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="font-mono" style={{ color: "hsl(var(--primary))" }}>{withCode}</span>
              /{cards.length} cards have Python examples
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
