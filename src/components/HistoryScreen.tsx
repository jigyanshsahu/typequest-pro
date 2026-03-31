import { Keyboard, Trash2, Trophy, Target, Zap, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TestResult } from "@/hooks/useHistory";

interface HistoryScreenProps {
  history: TestResult[];
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  totalTests: number;
  bestByTopic: Record<string, TestResult>;
  wpmOverTime: { test: number; wpm: number; accuracy: number }[];
  achievements: { id: string; title: string; description: string; icon: string; unlocked: boolean; unlockedAt?: number }[];
  unlockedCount: number;
  totalAchievementCount: number;
  onBack: () => void;
  onClearHistory: () => void;
}

export function HistoryScreen({
  history,
  bestWpm,
  avgWpm,
  avgAccuracy,
  totalTests,
  bestByTopic,
  wpmOverTime,
  achievements,
  unlockedCount,
  totalAchievementCount,
  onBack,
  onClearHistory,
}: HistoryScreenProps) {
  const topicEntries = Object.entries(bestByTopic).sort((a, b) => b[1].wpm - a[1].wpm);

  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-8 animate-in fade-in duration-500">
      {/* Logo - top right */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 transition-opacity hover:opacity-70"
      >
        <Keyboard className="h-5 w-5 text-primary" />
        <span className="font-sans text-lg font-bold text-foreground">
          type<span className="text-primary">quest</span>
        </span>
      </button>

      <div className="w-full max-w-3xl space-y-8 mt-16">
        {/* Title */}
        <div className="text-center">
          <h2 className="font-sans text-3xl font-bold text-foreground">your progress</h2>
          <p className="mt-1 text-muted-foreground">
            {totalTests} test{totalTests !== 1 ? "s" : ""} completed
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "best wpm", value: bestWpm, icon: Zap, color: "text-primary" },
            { label: "avg wpm", value: avgWpm, icon: Target, color: "text-foreground" },
            { label: "avg accuracy", value: `${avgAccuracy}%`, icon: Target, color: "text-success" },
            { label: "badges", value: `${unlockedCount}/${totalAchievementCount}`, icon: Trophy, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-center">
              <stat.icon className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
              <div className={`text-2xl font-bold ${stat.color}`} style={{ fontVariantNumeric: "tabular-nums" }}>
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* WPM Over Time Chart */}
        {wpmOverTime.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm text-muted-foreground">wpm progress (last 20 tests)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wpmOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                <XAxis
                  dataKey="test"
                  tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 6%)",
                    border: "1px solid hsl(0, 0%, 15%)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(0, 0%, 45%)" }}
                  labelFormatter={(v) => `Test #${v}`}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="hsl(0, 0%, 100%)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(0, 0%, 100%)" }}
                  name="WPM"
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(142, 60%, 45%)"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
                  name="Accuracy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Achievements */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            achievements ({unlockedCount}/{totalAchievementCount})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border p-3 text-center transition-all ${
                  a.unlocked
                    ? "border-primary bg-secondary"
                    : "border-border bg-card opacity-40"
                }`}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-xs font-medium text-foreground">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
                {a.unlocked && a.unlockedAt && (
                  <div className="text-xs text-muted-foreground/50 mt-1">
                    {new Date(a.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Best By Topic */}
        {topicEntries.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm text-muted-foreground">best scores by topic</h3>
            <div className="space-y-2">
              {topicEntries.slice(0, 10).map(([topic, result]) => (
                <div
                  key={topic}
                  className="flex items-center justify-between rounded-md bg-secondary px-4 py-2.5"
                >
                  <span className="text-sm text-foreground capitalize">{topic}</span>
                  <div className="flex items-center gap-4 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <span className="text-primary font-bold">{result.wpm} wpm</span>
                    <span className="text-muted-foreground">{result.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tests */}
        {history.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              recent tests
            </h3>
            <div className="space-y-1">
              {history.slice(0, 15).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-foreground capitalize">{r.topic}</span>
                    <span className="text-xs text-muted-foreground/50">{r.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-4" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <span className="text-foreground font-medium">{r.wpm} wpm</span>
                    <span className="text-muted-foreground">{r.accuracy}%</span>
                    <span className="text-xs text-muted-foreground/40 w-20 text-right">
                      {formatTimeAgo(r.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onBack}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          >
            back to typing
          </button>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground transition-all hover:text-destructive hover:border-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              clear history
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
