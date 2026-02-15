import { useEffect, useRef, useState, useLayoutEffect } from "react";

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
const LINE_HEIGHT_PX = 48;

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
  const innerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const [caretPos, setCaretPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // Scroll to keep current word visible
  useEffect(() => {
    const el = wordRefs.current[currentWordIndex];
    if (el && containerRef.current) {
      containerRef.current.scrollTop = Math.max(0, el.offsetTop - 8);
    }
  }, [currentWordIndex]);

  // Update caret position smoothly
  useLayoutEffect(() => {
    const word = words[currentWordIndex];
    if (!word || !innerRef.current) return;

    const charIndex = currentInput.length;
    let targetEl: HTMLSpanElement | null = null;
    let placeAfter = false;

    if (charIndex < word.length) {
      // Caret before this character
      targetEl = charRefs.current.get(`${currentWordIndex}-${charIndex}`) || null;
    } else {
      // Caret after last char (or after extra typed chars)
      // Use the word ref's end
      const wordEl = wordRefs.current[currentWordIndex];
      if (wordEl && innerRef.current) {
        const containerRect = innerRef.current.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();
        setCaretPos({
          left: wordRect.right - containerRect.left,
          top: wordRect.top - containerRect.top,
        });
        return;
      }
    }

    if (targetEl && innerRef.current) {
      const containerRect = innerRef.current.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setCaretPos({
        left: targetRect.left - containerRect.left,
        top: targetRect.top - containerRect.top,
      });
    }
  }, [currentWordIndex, currentInput, words]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const setCharRef = (key: string, el: HTMLSpanElement | null) => {
    if (el) {
      charRefs.current.set(key, el);
    } else {
      charRefs.current.delete(key);
    }
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
          <div ref={innerRef} className="relative flex flex-wrap gap-x-2.5 gap-y-2">
            {/* Smooth caret */}
            <span
              className="absolute w-[2px] bg-foreground pointer-events-none z-10"
              style={{
                height: "1.4em",
                transform: `translate(${caretPos.left}px, ${caretPos.top}px)`,
                transition: "transform 80ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
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

                    if (isFuture) {
                      className = "text-muted-foreground";
                    } else if (isPast) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "incorrect") {
                        className = "text-destructive";
                      } else if (status === "correct") {
                        className = "text-foreground";
                      } else {
                        className = "text-muted-foreground";
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
                      <span
                        key={ci}
                        ref={(el) => setCharRef(`${wi}-${ci}`, el)}
                        className={className}
                      >
                        {char}
                      </span>
                    );
                  })}
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
