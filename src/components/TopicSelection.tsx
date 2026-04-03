import { useState, useRef, useEffect } from "react";
import { Keyboard, Loader2, Settings, RotateCcw } from "lucide-react";
import type { Preferences, GameMode, CaretStyle, FontSize, Difficulty } from "@/hooks/usePreferences";

const TOPIC_CHIPS = [
  "Photosynthesis", "Newton's Laws", "World War II", "Solar System",
  "DNA Replication", "Democracy", "Climate Change", "Periodic Table",
  "Shakespeare", "Quantum Physics", "Indian Constitution", "Binary Search",
];

const DURATIONS = [15, 30, 60, 90, 120];
const WORD_GOALS = [25, 50, 100, 200];
const GAME_MODES: { value: GameMode; label: string; desc: string }[] = [
  { value: "timed", label: "timed", desc: "race the clock" },
  { value: "practice", label: "zen", desc: "no timer, just flow" },
  { value: "words", label: "words", desc: "finish a word goal" },
];
const CARET_STYLES: { value: CaretStyle; label: string }[] = [
  { value: "bar", label: "│" },
  { value: "block", label: "█" },
  { value: "underline", label: "▁" },
];
const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: "small", label: "Sm" },
  { value: "medium", label: "Md" },
  { value: "large", label: "Lg" },
];

interface TopicSelectionProps {
  onStart: (topic: string) => void;
  isLoading: boolean;
  prefs: Preferences;
  onUpdatePref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  onResetPrefs: () => void;
  onShowHistory: () => void;
  totalTests: number;
  bestWpm: number;
}

export function TopicSelection({ onStart, isLoading, prefs, onUpdatePref, onResetPrefs, onShowHistory, totalTests, bestWpm }: TopicSelectionProps) {
  const [topic, setTopic] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleStart = () => {
    const trimmed = topic.trim();
    if (trimmed) {
      onStart(trimmed);
    } else if (topic.length > 0) {
      // Pick a random topic if user just typed spaces (shortcut for "surprise me")
      const random = TOPIC_CHIPS[Math.floor(Math.random() * TOPIC_CHIPS.length)];
      onStart(random);
    }
  };

  const handleChipClick = (t: string) => {
    setTopic(t);
    onStart(t);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-500">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <Keyboard className="h-8 w-8 text-primary" />
          <h1 className="font-sans text-4xl font-bold tracking-tight text-foreground">
            type<span className="text-primary">quest</span>
          </h1>
        </div>

        <p className="text-center text-muted-foreground">
          learn while you type — pick a topic and start practicing
        </p>

        {/* Topic input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="enter a topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStart();
                // If input is empty/whitespace, Space also triggers "Go" (Random topic)
                if (e.key === " " && topic.trim().length === 0) {
                  e.preventDefault();
                  handleStart();
                }
              }}
              className="w-full rounded-lg border border-border bg-secondary px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              disabled={isLoading}
            />
            {topic.length > 0 && !isLoading && (
              <button
                onClick={handleStart}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-80"
              >
                go →
              </button>
            )}
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Quick topic chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {TOPIC_CHIPS.map((t) => (
              <button
                key={t}
                onClick={() => handleChipClick(t)}
                disabled={isLoading}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Mode bar — compact inline selector */}
        <div className="flex flex-wrap items-center justify-center gap-6 rounded-lg border border-border bg-card px-6 py-4">
          {/* Game mode */}
          <div className="flex items-center gap-1">
            {GAME_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => onUpdatePref("gameMode", m.value)}
                title={m.desc}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  prefs.gameMode === m.value
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Duration or word count */}
          {prefs.gameMode === "timed" && (
            <div className="flex items-center gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => onUpdatePref("duration", d)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    prefs.duration === d
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {prefs.gameMode === "words" && (
            <div className="flex items-center gap-1">
              {WORD_GOALS.map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdatePref("wordGoal", w)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    prefs.wordGoal === w
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {prefs.gameMode === "practice" && (
            <span className="text-sm text-muted-foreground italic">no limits — just type</span>
          )}
        </div>

        {/* Appearance settings (collapsible) */}
        <div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="mx-auto flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            appearance
            <span className="text-xs">{showSettings ? "▲" : "▼"}</span>
          </button>

          {showSettings && (
            <div className="mt-3 space-y-5 rounded-lg border border-border bg-card p-6 animate-in slide-in-from-top-2 duration-200">
              {/* Target WPM */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  target wpm: <span className="text-foreground font-medium">{prefs.targetWpm}</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={prefs.targetWpm}
                  onChange={(e) => onUpdatePref("targetWpm", Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>20</span>
                  <span>200</span>
                </div>
              </div>

              {/* Font size */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">font size</label>
                <div className="flex gap-2">
                  {FONT_SIZES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => onUpdatePref("fontSize", f.value)}
                      className={`rounded-md px-4 py-2 text-sm transition-colors ${
                        prefs.fontSize === f.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caret style */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">caret style</label>
                <div className="flex gap-2">
                  {CARET_STYLES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => onUpdatePref("caretStyle", c.value)}
                      className={`rounded-md px-5 py-2 text-lg font-mono transition-colors ${
                        prefs.caretStyle === c.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-3">
                <ToggleChip
                  label="punctuation"
                  active={prefs.punctuation}
                  onClick={() => onUpdatePref("punctuation", !prefs.punctuation)}
                />
                <ToggleChip
                  label="numbers"
                  active={prefs.numbers}
                  onClick={() => onUpdatePref("numbers", !prefs.numbers)}
                />
                <ToggleChip
                  label="ghost caret"
                  active={prefs.showGhostCaret}
                  onClick={() => onUpdatePref("showGhostCaret", !prefs.showGhostCaret)}
                />
                <ToggleChip
                  label="smooth caret"
                  active={prefs.smoothCaret}
                  onClick={() => onUpdatePref("smoothCaret", !prefs.smoothCaret)}
                />
              </div>

              {/* Reset */}
              <button
                onClick={onResetPrefs}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                reset to defaults
              </button>
            </div>
          )}
        </div>

        {/* Progress / History button */}
        {totalTests > 0 && (
          <button
            onClick={onShowHistory}
            className="mx-auto flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3 text-sm transition-all hover:border-primary hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-muted-foreground">
              <span className="text-foreground font-bold">{totalTests}</span> tests
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">
              best: <span className="text-foreground font-bold">{bestWpm}</span> wpm
            </span>
            <span className="text-xs text-muted-foreground/50">→ view progress</span>
          </button>
        )}

        {/* Bottom hint */}
        <p className="text-center text-xs text-muted-foreground/50">
          press <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-xs">Enter</kbd> to start
        </p>
      </div>
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-secondary text-foreground"
          : "border-border text-muted-foreground hover:border-muted-foreground"
      }`}
    >
      {active ? "✓ " : ""}{label}
    </button>
  );
}
