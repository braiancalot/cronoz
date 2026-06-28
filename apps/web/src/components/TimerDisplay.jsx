import { CopyIcon } from "@phosphor-icons/react";
import { formatTimeCompact } from "@/lib/stopwatch";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { cn } from "@/lib/utils.js";
import { toast } from "sonner";

const MS_PER_HOUR = 60 * 60 * 1000;

const SIZES = {
  default: {
    gap: "gap-4",
    time: "text-6xl md:text-8xl",
    milliseconds: "text-4xl md:text-6xl",
    meta: "text-lg",
    price: "text-base md:text-lg",
    indicatorOffset: "-left-8",
    indicatorSize: "size-4",
  },
  compact: {
    gap: "gap-2",
    time: "text-5xl",
    milliseconds: "text-3xl",
    meta: "text-base",
    price: "text-base",
    indicatorOffset: "-left-7",
    indicatorSize: "size-3.5",
  },
  mini: {
    gap: "gap-1.5",
    time: "text-3xl",
    milliseconds: "text-xl",
    meta: "text-sm",
    price: "text-sm",
    indicatorOffset: "-left-5",
    indicatorSize: "size-2.5",
  },
};

function calculateTotalPrice(totalTime, hourlyPrice) {
  return (totalTime / MS_PER_HOUR) * hourlyPrice;
}

export function TimerDisplay({
  time,
  totalTime = null,
  isRunning = false,
  hourlyPrice = 10,
  enableCopy = true,
  showPrice = true,
  size = "default",
}) {
  const s = SIZES[size];
  const ignoreMs = useIgnoreMilliseconds();
  const priceBase = totalTime !== null ? totalTime : time;
  const price = calculateTotalPrice(priceBase, hourlyPrice);
  const priceFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  async function copyToClipboard(event, text, label) {
    event.stopPropagation();
    // Use the clipboard of the window holding the clicked element: in the PiP
    // window the main document is unfocused, so its navigator.clipboard rejects.
    const view = event.currentTarget.ownerDocument.defaultView ?? window;
    await view.navigator.clipboard.writeText(text);
    // The sonner toaster lives in the main document, so it's invisible from the
    // PiP window — skip the toast there and copy silently.
    if (view === window) {
      toast(`${label} copiado`, { position: "top-center" });
    }
  }

  return (
    <div className={cn("flex flex-col items-center", s.gap)}>
      <div className="relative">
        {isRunning && (
          <span
            aria-label="Cronômetro em andamento"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex",
              s.indicatorOffset,
              s.indicatorSize,
            )}
          >
            <span className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
            <span
              className={cn(
                "relative rounded-full bg-primary",
                s.indicatorSize,
              )}
            />
          </span>
        )}
        <div
          onClick={
            enableCopy
              ? (e) => copyToClipboard(e, formatTimeCompact(time), "Tempo")
              : undefined
          }
          className={enableCopy ? "cursor-pointer" : undefined}
        >
          <FormattedTime
            time={time}
            showMilliseconds={!ignoreMs}
            className={s.time}
            millisecondsClassName={cn(s.milliseconds, "opacity-60")}
          />
        </div>
      </div>

      <div
        className={cn(
          "relative group grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isRunning
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex gap-2 items-center justify-center">
            {totalTime !== null && (
              <div
                onClick={
                  enableCopy && !isRunning
                    ? (e) =>
                        copyToClipboard(
                          e,
                          formatTimeCompact(totalTime),
                          "Tempo total",
                        )
                    : undefined
                }
                className={
                  enableCopy && !isRunning ? "cursor-pointer" : undefined
                }
              >
                <FormattedTime
                  time={totalTime}
                  className={cn("text-muted-foreground", s.meta)}
                />
              </div>
            )}

            {showPrice && (
              <>
                {totalTime !== null && (
                  <span className={cn("text-muted-foreground", s.meta)}>•</span>
                )}

                <span
                  onClick={
                    enableCopy && !isRunning
                      ? (e) => copyToClipboard(e, priceFormatted, "Valor")
                      : undefined
                  }
                  className={cn(
                    "font-medium text-primary",
                    s.price,
                    !isRunning && enableCopy && "cursor-pointer",
                  )}
                >
                  {priceFormatted}
                </span>

                {totalTime !== null && enableCopy && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) =>
                      copyToClipboard(
                        e,
                        `${formatTimeCompact(totalTime)} (${priceFormatted})`,
                        "Tempo e valor",
                      )
                    }
                    title="Copiar tempo e valor"
                    className={cn(
                      "text-muted-foreground transition-opacity md:absolute md:left-full md:inset-y-0 md:my-auto md:ml-1 md:opacity-0 md:group-hover:opacity-100",
                      isRunning && "invisible transition-none",
                    )}
                  >
                    <CopyIcon />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
