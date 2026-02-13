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
        <div className="relative flex flex-wrap gap-x-2.5 gap-y-2">
            {words.map((word, wi) => {
              const isCurrent = wi === currentWordIndex;
              const isPast = wi < currentWordIndex;
              const isFuture = wi > currentWordIndex;

              return (
                <span
                  key={wi}
                  ref={(el) => { wordRefs.current[wi] = el; }}
                  className={`relative inline-block transition-all duration-150 ${isCurrent ? "scale-[1.02]" : ""}`}
                >
                  {/* Moving bar / caret for current word */}
                  {isCurrent && (
                    <span
                      className="absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-150 ease-out"
                      style={{
                        width: `${Math.min((currentInput.length / Math.max(word.length, 1)) * 100, 100)}%`,
                      }}
                    />
                  )}
                  {word.split("").map((char, ci) => {
                    let style: React.CSSProperties = {};
                    let className = "";
                    const showCaret = isCurrent && ci === currentInput.length;

                    if (isFuture) {
                      style = { opacity: 0.4 };
                      className = "text-foreground";
                    } else if (isPast) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "incorrect") {
                        className = "text-destructive";
                        style = { opacity: 0.8 };
                      } else {
                        className = "text-foreground";
                        style = { opacity: 1 };
                      }
                    } else if (isCurrent) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "correct") {
                        className = "text-foreground";
                        style = { opacity: 1 };
                      } else if (status === "incorrect") {
                        className = "text-destructive";
                        style = { opacity: 0.8 };
                      } else {
                        className = "text-foreground";
                        style = { opacity: 0.4 };
                      }
                    }

                    return (
                      <span key={ci} className="relative">
                        {showCaret && (
                          <span className="absolute left-0 top-0 h-full w-[2px] bg-primary animate-blink" />
                        )}
                        <span className={`transition-opacity duration-100 ${className}`} style={style}>
                          {char}
                        </span>
                      </span>
                    );
                  })}
                  {/* Caret at end of word if all chars typed */}
                  {isCurrent && currentInput.length >= word.length && (
                    <span className="relative">
                      <span className="absolute left-0 top-0 h-full w-[2px] bg-primary animate-blink" />
                    </span>
                  )}
                  {/* Extra typed chars beyond word length */}
                  {isCurrent && currentInput.length > word.length && (
                    <span className="text-destructive" style={{ opacity: 0.6 }}>
                      {currentInput.slice(word.length)}
                    </span>
                  )}
                </span>
              );
            })}
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
