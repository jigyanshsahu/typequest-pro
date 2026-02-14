import { useEffect, useRef } from "react";

interface TypingInterfaceProps {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  charStatuses: Record<number, Record<number, "correct" | "incorrect">>;
  timeLeft: number;
  wpm: number;
  accuracy: number;
  isActive: boolean;
}

const VISIBLE_LINES = 3;
const LINE_HEIGHT_PX = 48; // approximate line height for text-2xl leading-loose

export function TypingInterface({
  words,
  currentWordIndex,
  currentInput,
  charStatuses,
  timeLeft,
  wpm,
  accuracy,
  isActive,
}: TypingInterfaceProps) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wordRefs.current[currentWordIndex];
    if (el && containerRef.current) {
      const container = containerRef.current;
      const elTop = el.offsetTop;
      // Keep current word in the first visible line
      container.scrollTop = Math.max(0, elTop - 8);
    }
  }, [currentWordIndex]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-5xl space-y-10">
        {/* Stats bar */}
        <div className="flex items-center justify-between text-base">
          <div className="flex items-center gap-8">
            <span className="text-muted-foreground">
              wpm: <span className="text-3xl font-bold text-foreground">{wpm}</span>
            </span>
            <span className="text-muted-foreground">
              acc: <span className="text-3xl font-bold text-foreground">{accuracy}%</span>
            </span>
          </div>
          <span className={`text-4xl font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse-glow" : "text-foreground"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Words display - only 3 lines visible */}
        <div
          ref={containerRef}
          className="overflow-hidden rounded-xl border border-border bg-card p-8 text-2xl leading-loose"
          style={{ height: `${VISIBLE_LINES * LINE_HEIGHT_PX + 16}px` }}
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
                  className="relative inline-block"
                >
                  {word.split("").map((char, ci) => {
                    let className = "";
                    const showCaret = isCurrent && ci === currentInput.length;

                    if (isFuture) {
                      className = "text-muted-foreground";
                    } else if (isPast) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "incorrect") {
                        className = "text-destructive";
                      } else {
                        className = "text-foreground";
                      }
                    } else if (isCurrent) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "correct") {
                        className = "text-foreground";
                      } else if (status === "incorrect") {
                        className = "text-destructive";
                      } else {
                        className = "text-muted-foreground";
                      }
                    }

                    return (
                      <span key={ci} className="relative">
                         {showCaret && (
                          <span className="absolute left-0 top-0 h-full w-[2px] bg-foreground animate-blink transition-all duration-75 ease-out" />
                        )}
                        <span className={className}>
                          {char}
                        </span>
                      </span>
                    );
                  })}
                   {/* Caret at end of word if all chars typed */}
                  {isCurrent && currentInput.length >= word.length && (
                    <span className="relative">
                      <span className="absolute left-0 top-0 h-full w-[2px] bg-foreground animate-blink transition-all duration-75 ease-out" />
                    </span>
                  )}
                  {/* Extra typed chars beyond word length */}
                  {isCurrent && currentInput.length > word.length && (
                    <span className="text-destructive">
                      {currentInput.slice(word.length)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        <div className="text-center">
          {!isActive && currentWordIndex === 0 && (
            <p className="animate-pulse-glow text-sm text-muted-foreground">start typing to begin...</p>
          )}
        </div>
      </div>
    </div>
  );
}
