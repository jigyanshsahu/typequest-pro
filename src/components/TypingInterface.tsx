import { useEffect, useRef } from "react";
import type { WpmDataPoint } from "@/hooks/useTypingGame";

interface TypingInterfaceProps {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  charStatuses: Record<number, Record<number, "correct" | "incorrect">>;
  timeLeft: number;
  wpm: number;
  accuracy: number;
  targetWpm: number;
  isActive: boolean;
}

export function TypingInterface({
  words,
  currentWordIndex,
  currentInput,
  charStatuses,
  timeLeft,
  wpm,
  accuracy,
  targetWpm,
  isActive,
}: TypingInterfaceProps) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wordRefs.current[currentWordIndex];
    if (el && containerRef.current) {
      const container = containerRef.current;
      const elTop = el.offsetTop;
      const containerHeight = container.clientHeight;
      if (elTop > containerHeight / 2) {
        container.scrollTop = elTop - containerHeight / 3;
      }
    }
  }, [currentWordIndex]);

  const speedRatio = Math.min(wpm / targetWpm, 2);
  const speedPercent = Math.min(speedRatio * 50, 100);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground">
              wpm: <span className="text-2xl font-bold text-primary">{wpm}</span>
            </span>
            <span className="text-muted-foreground">
              acc: <span className="text-2xl font-bold text-foreground">{accuracy}%</span>
            </span>
          </div>
          <span className={`text-3xl font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse-glow" : "text-foreground"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Speed bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>speed</span>
            <span>target: {targetWpm} wpm</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${speedPercent}%`,
                backgroundColor: speedRatio >= 1 ? "hsl(var(--success))" : speedRatio >= 0.7 ? "hsl(var(--primary))" : "hsl(var(--destructive))",
              }}
            />
            {/* Target line */}
            <div className="absolute top-0 h-full w-0.5 bg-foreground/30" style={{ left: "50%" }} />
          </div>
        </div>

        {/* Words display */}
        <div
          ref={containerRef}
          className="max-h-48 overflow-hidden rounded-lg border border-border bg-card p-6 text-xl leading-relaxed"
        >
          <div className="flex flex-wrap gap-x-2.5 gap-y-2">
            {words.map((word, wi) => (
              <span
                key={wi}
                ref={(el) => { wordRefs.current[wi] = el; }}
                className={`inline-block ${wi === currentWordIndex ? "border-b-2 border-primary" : ""}`}
              >
                {word.split("").map((char, ci) => {
                  let colorClass = "text-muted-foreground";
                  if (wi < currentWordIndex) {
                    const status = charStatuses[wi]?.[ci];
                    colorClass = status === "incorrect" ? "text-destructive" : "text-foreground";
                  } else if (wi === currentWordIndex) {
                    const status = charStatuses[wi]?.[ci];
                    if (status === "correct") colorClass = "text-foreground";
                    else if (status === "incorrect") colorClass = "text-destructive";
                  }
                  return (
                    <span key={ci} className={colorClass}>
                      {char}
                    </span>
                  );
                })}
                {/* Extra typed chars beyond word length */}
                {wi === currentWordIndex && currentInput.length > word.length && (
                  <span className="text-destructive/60">
                    {currentInput.slice(word.length)}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Current input display */}
        <div className="text-center">
          {!isActive && currentWordIndex === 0 && (
            <p className="animate-pulse-glow text-sm text-muted-foreground">start typing to begin...</p>
          )}
        </div>
      </div>
    </div>
  );
}
