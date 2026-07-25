import { CopyIcon } from "@phosphor-icons/react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { copyFromEvent } from "@/lib/clipboard.js";
import { formatTimeCompact } from "@/lib/stopwatch.js";
import { cn } from "@/lib/utils.js";

// Total time and price under the timer. Fades out while running but keeps its
// space, so the laps below don't shift when the stopwatch starts.
export function TimerMeta({
  totalTime,
  priceFormatted,
  showPrice,
  enableCopy,
  isRunning,
  metaClass,
  priceClass,
}) {
  const canCopy = enableCopy && !isRunning;
  const hasTotal = totalTime !== null;

  return (
    <div
      className={cn(
        "relative group transition-opacity duration-300 ease-out",
        isRunning ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="flex gap-2 items-center justify-center">
        {hasTotal && (
          <div
            onClick={
              canCopy
                ? (e) =>
                    copyFromEvent(
                      e,
                      formatTimeCompact(totalTime),
                      "Tempo total",
                    )
                : undefined
            }
            className={canCopy ? "cursor-pointer" : undefined}
          >
            <FormattedTime
              time={totalTime}
              className={cn("text-muted-foreground", metaClass)}
            />
          </div>
        )}

        {showPrice && (
          <>
            {hasTotal && (
              <span className={cn("text-muted-foreground", metaClass)}>•</span>
            )}

            <span
              onClick={
                canCopy
                  ? (e) => copyFromEvent(e, priceFormatted, "Valor")
                  : undefined
              }
              className={cn(
                "font-medium text-primary",
                priceClass,
                canCopy && "cursor-pointer",
              )}
            >
              {priceFormatted}
            </span>

            {hasTotal && enableCopy && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) =>
                  copyFromEvent(
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
  );
}
