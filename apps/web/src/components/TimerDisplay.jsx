import { formatTime, hasHours, truncateToSecond } from "@/lib/stopwatch";
import { FormattedTime } from "@/components/FormattedTime.jsx";
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
  const displayTime = ignoreMs ? truncateToSecond(time) : time;
  const displayTotalTime =
    totalTime !== null && ignoreMs ? truncateToSecond(totalTime) : totalTime;
  const priceBase = displayTotalTime !== null ? displayTotalTime : displayTime;
  const price = calculateTotalPrice(priceBase, hourlyPrice);

  async function handleCopyToClipboard() {
    const { hours: h, minutes: m } = formatTime(
      displayTotalTime !== null ? displayTotalTime : displayTime,
    );
    let formatted = "";

    if (hasHours(h)) formatted += `${h}h`;
    formatted += `${m}m`;

    await navigator.clipboard.writeText(formatted);
    toast("Tempo copiado", { position: "top-center" });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div onClick={handleCopyToClipboard} className="cursor-pointer">
        <FormattedTime
          time={displayTime}
          showMilliseconds={!ignoreMs}
          className="text-6xl md:text-8xl"
          millisecondsClassName="text-4xl md:text-6xl opacity-60"
        />
      </div>

      <div className="flex gap-2 items-center">
        {displayTotalTime !== null && !isRunning && (
          <>
            <FormattedTime
              time={displayTotalTime}
              className="text-lg text-muted-foreground"
            />

            <span className="text-lg text-muted-foreground">•</span>
          </>
        )}

        <span
          className={`font-medium text-md md:text-lg text-primary ${isRunning && "invisible"}`}
        >
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(price)}
        </span>
      </div>
    </div>
  );
}
