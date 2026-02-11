import { RotateCcw, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { WpmDataPoint } from "@/hooks/useTypingGame";

interface ResultsScreenProps {
  wpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
  wpmHistory: WpmDataPoint[];
  targetWpm: number;
  topic: string;
  text: string;
  onTryAgain: () => void;
  onNewTopic: () => void;
}

export function ResultsScreen({
  wpm,
  accuracy,
  correctWords,
  incorrectWords,
  wpmHistory,
  targetWpm,
  topic,
  text,
  onTryAgain,
  onNewTopic,
}: ResultsScreenProps) {
  const hitTarget = wpm >= targetWpm;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="font-sans text-3xl font-bold text-foreground">results</h2>
          <p className="mt-1 text-muted-foreground">topic: {topic}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "wpm", value: wpm, color: "text-primary" },
            { label: "accuracy", value: `${accuracy}%`, color: "text-foreground" },
            { label: "correct", value: correctWords, color: "text-success" },
            { label: "incorrect", value: incorrectWords, color: "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Target hit */}
        {hitTarget && (
          <div className="flex items-center justify-center gap-2 text-success">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Target of {targetWpm} WPM achieved!</span>
          </div>
        )}

        {/* Speed graph */}
        {wpmHistory.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm text-muted-foreground">speed over time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wpmHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
                <XAxis dataKey="time" tick={{ fill: "hsl(220, 10%, 40%)", fontSize: 12 }} tickFormatter={(v) => `${v}s`} />
                <YAxis tick={{ fill: "hsl(220, 10%, 40%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(228, 12%, 11%)", border: "1px solid hsl(228, 10%, 18%)", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(220, 15%, 65%)" }}
                  itemStyle={{ color: "hsl(46, 80%, 58%)" }}
                  labelFormatter={(v) => `${v}s`}
                />
                <ReferenceLine y={targetWpm} stroke="hsl(220, 10%, 40%)" strokeDasharray="5 5" label={{ value: "target", fill: "hsl(220, 10%, 40%)", fontSize: 12 }} />
                <Line type="monotone" dataKey="wpm" stroke="hsl(46, 80%, 58%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Text snippet */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground line-clamp-3">{text}</p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onTryAgain}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 text-foreground transition-colors hover:border-primary"
          >
            <RotateCcw className="h-4 w-4" />
            try again
          </button>
          <button
            onClick={onNewTopic}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            new topic
          </button>
        </div>
      </div>
    </div>
  );
}
