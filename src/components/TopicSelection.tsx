import { useState } from "react";
import { Keyboard, Loader2, Settings, RotateCcw } from "lucide-react";
import type { Preferences, GameMode, CaretStyle, FontSize } from "@/hooks/usePreferences";

const TOPIC_CHIPS = ["Science", "History", "Technology", "Literature", "Geography", "Space", "Music", "Philosophy"];
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
}

export function TopicSelection({ onStart, isLoading, prefs, onUpdatePref, onResetPrefs }: TopicSelectionProps) {
  const [topic, setTopic] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = () => {
    if (topic.trim()) onStart(topic.trim());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
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
                onClick={() => { setTopic(t); onStart(t); }}
                disabled={isLoading}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">mode</label>
          <div className="grid grid-cols-3 gap-2">
            {GAME_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => onUpdatePref("gameMode", m.value)}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  prefs.gameMode === m.value
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Timer / Word Goal (conditional) */}
        <div className="space-y-6 rounded-lg border border-border bg-card p-6">
          {prefs.gameMode === "timed" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">timer</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => onUpdatePref("duration", d)}
                    className={`rounded-md px-4 py-2 text-sm transition-colors ${
                      prefs.duration === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {prefs.gameMode === "words" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">word goal</label>
              <div className="flex flex-wrap gap-2">
                {WORD_GOALS.map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdatePref("wordGoal", w)}
                    className={`rounded-md px-4 py-2 text-sm transition-colors ${
                      prefs.wordGoal === w
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          </div>
        </div>

        {/* Visual Settings (collapsible) */}
        <div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            appearance
            <span className="text-xs">{showSettings ? "▲" : "▼"}</span>
          </button>

          {showSettings && (
            <div className="mt-3 space-y-5 rounded-lg border border-border bg-card p-6">
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
