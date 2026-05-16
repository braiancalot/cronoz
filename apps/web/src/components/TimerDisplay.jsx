import { CopyIcon } from "lucide-react";
import { formatTimeCompact } from "@/lib/stopwatch";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
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

  async function copyToClipboard(text, label) {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`, { position: "top-center" });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {isRunning && (
          <span
            aria-label="Cronômetro em andamento"
            className="absolute -left-6 top-1/2 -translate-y-1/2 size-3 rounded-full bg-primary animate-pulse"
          />
        )}
        <div
          onClick={() => copyToClipboard(formatTimeCompact(time), "Tempo")}
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

      <div className="flex gap-2 items-center">
        {totalTime !== null && !isRunning && (
          <>
            <div
              onClick={() =>
                copyToClipboard(formatTimeCompact(totalTime), "Tempo total")
              }
              className="cursor-pointer"
            >
              <FormattedTime
                time={totalTime}
                className="text-lg text-muted-foreground"
              />
            </div>

            <span className="text-lg text-muted-foreground">•</span>
          </>
        )}

        <span
          onClick={() => !isRunning && copyToClipboard(priceFormatted, "Valor")}
          className={`font-medium text-md md:text-lg text-primary ${isRunning ? "invisible" : "cursor-pointer"}`}
        >
          {priceFormatted}
        </span>

        {totalTime !== null && !isRunning && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              copyToClipboard(
                `${formatTimeCompact(totalTime)} (${priceFormatted})`,
                "Tempo e valor",
              )
            }
            title="Copiar tempo e valor"
          >
            <CopyIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
