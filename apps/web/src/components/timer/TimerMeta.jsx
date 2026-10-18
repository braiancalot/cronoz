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
  reserveEmptyLine = false,
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
        {/* With the price hidden a lapless timer has nothing to show here.
            Holding the line keeps the first lap from shifting the stage. */}
        {reserveEmptyLine && !hasTotal && (
          <span aria-hidden className={cn("invisible", priceClass)}>
            &nbsp;
          </span>
        )}

        {hasTotal && (
          <div
            onClick={
              canCopy
                ? (event) =>
                    copyFromEvent(
                      event,
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
                  ? (event) => copyFromEvent(event, priceFormatted, "Valor")
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
                onClick={(event) =>
                  copyFromEvent(
                    event,
                    `${formatTimeCompact(totalTime)} (${priceFormatted})`,
                    "Tempo e valor",
                    { plural: true },
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
