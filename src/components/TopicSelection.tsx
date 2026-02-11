import { useState } from "react";
import { Keyboard, Loader2 } from "lucide-react";

const TOPIC_CHIPS = ["Science", "History", "Technology", "Literature", "Geography", "Space", "Music", "Philosophy"];
const DURATIONS = [15, 30, 60, 90];

interface TopicSelectionProps {
  onStart: (topic: string, duration: number, targetWpm: number) => void;
  isLoading: boolean;
}

export function TopicSelection({ onStart, isLoading }: TopicSelectionProps) {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(30);
  const [targetWpm, setTargetWpm] = useState(60);

  const handleStart = () => {
    if (topic.trim()) onStart(topic.trim(), duration, targetWpm);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <Keyboard className="h-8 w-8 text-primary" />
          <h1 className="font-sans text-4xl font-bold tracking-tight text-foreground">
            type<span className="text-primary">learn</span>
          </h1>
        </div>

        <p className="text-center text-muted-foreground">
          Learn while you type. Pick a topic and start practicing.
        </p>

        {/* Topic input */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="type a topic... (e.g. quantum physics)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            className="w-full rounded-lg border border-border bg-secondary px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />

          {/* Quick chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {TOPIC_CHIPS.map((t) => (
              <button
                key={t}
                onClick={() => { setTopic(t); onStart(t, duration, targetWpm); }}
                disabled={isLoading}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6 rounded-lg border border-border bg-card p-6">
          {/* Timer */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">timer</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-md px-4 py-2 text-sm transition-colors ${
                    duration === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Target WPM */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              target wpm: <span className="text-primary">{targetWpm}</span>
            </label>
            <input
              type="range"
              min={20}
              max={200}
              value={targetWpm}
              onChange={(e) => setTargetWpm(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>20</span>
              <span>200</span>
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!topic.trim() || isLoading}
          className="mx-auto flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              generating text...
            </>
          ) : (
            "start typing"
          )}
        </button>
      </div>
    </div>
  );
}
