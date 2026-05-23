import { CopyIcon } from "lucide-react";
import { formatTimeCompact } from "@/lib/stopwatch";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { cn } from "@/lib/utils.js";
import { toast } from "sonner";

const MS_PER_HOUR = 60 * 60 * 1000;

function calculateTotalPrice(totalTime, hourlyPrice) {
  return (totalTime / MS_PER_HOUR) * hourlyPrice;
}

export function TimerDisplay({
  time,
  totalTime = null,
  isRunning = false,
  hourlyPrice = 10,
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const priceBase = totalTime !== null ? totalTime : time;
  const price = calculateTotalPrice(priceBase, hourlyPrice);
  const priceFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  async function copyToClipboard(event, text, label) {
    event.stopPropagation();
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`, { position: "top-center" });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {isRunning && (
          <span
            aria-label="Cronômetro em andamento"
            className="absolute -left-8 top-1/2 -translate-y-1/2 flex size-4"
          >
            <span className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative size-4 rounded-full bg-primary" />
          </span>
        )}
        <div
          onClick={(e) => copyToClipboard(e, formatTimeCompact(time), "Tempo")}
          className="cursor-pointer"
        >
          <FormattedTime
            time={time}
            showMilliseconds={!ignoreMs}
            className="text-6xl md:text-8xl"
            millisecondsClassName="text-4xl md:text-6xl opacity-60"
          />
        </div>
      </div>

      <div className="relative flex gap-2 items-center group">
        {totalTime !== null && (
          <>
            <div
              onClick={(e) =>
                !isRunning &&
                copyToClipboard(e, formatTimeCompact(totalTime), "Tempo total")
              }
              className={isRunning ? "invisible" : "cursor-pointer"}
            >
              <FormattedTime
                time={totalTime}
                className="text-lg text-muted-foreground"
              />
            </div>

            <span
              className={`text-lg text-muted-foreground ${isRunning ? "invisible" : ""}`}
            >
              •
            </span>
          </>
        )}

        <span
          onClick={(e) =>
            !isRunning && copyToClipboard(e, priceFormatted, "Valor")
          }
          className={`font-medium text-md md:text-lg text-primary ${isRunning ? "invisible" : "cursor-pointer"}`}
        >
          {priceFormatted}
        </span>

        {totalTime !== null && (
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
              "text-muted-foreground transition-opacity md:absolute md:left-full md:top-1/2 md:-translate-y-1/2 md:ml-1 md:opacity-0 md:group-hover:opacity-100",
              isRunning && "invisible transition-none",
            )}
          >
            <CopyIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
