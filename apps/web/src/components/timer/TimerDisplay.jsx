import { FormattedTime } from "@/components/FormattedTime.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { copyFromEvent } from "@/lib/clipboard.js";
import { formatTimeCompact, calculateTotalPrice } from "@/lib/stopwatch.js";
import { cn } from "@/lib/utils.js";
import { RunningIndicator } from "./RunningIndicator.jsx";
import { TimerMeta } from "./TimerMeta.jsx";
import { SIZES, FLUID } from "./timerDisplaySizes.js";

export function TimerDisplay({
  time,
  totalTime = null,
  isRunning = false,
  hourlyPrice = 10,
  enableCopy = true,
  showPrice = true,
  size = "default",
  fluid = false,
}) {
  const s = SIZES[size];
  const ignoreMs = useIgnoreMilliseconds();

  const priceBase = totalTime !== null ? totalTime : time;
  const priceFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(calculateTotalPrice(priceBase, hourlyPrice));

  return (
    <div
      className={cn("flex flex-col items-center", fluid ? FLUID.gap : s.gap)}
    >
      <div
        className={cn(
          "relative transition-transform duration-300 ease-out",
          isRunning && (fluid ? FLUID.runningShift : s.runningShift),
        )}
      >
        {isRunning && (
          <RunningIndicator
            offsetClass={s.indicatorOffset}
            sizeClass={s.indicatorSize}
          />
        )}
        <div
          onClick={
            enableCopy
              ? (e) => copyFromEvent(e, formatTimeCompact(time), "Tempo")
              : undefined
          }
          className={enableCopy ? "cursor-pointer" : undefined}
        >
          <FormattedTime
            time={time}
            showMilliseconds={!ignoreMs}
            className={fluid ? FLUID.time : s.time}
            millisecondsClassName={cn(
              fluid ? FLUID.milliseconds : s.milliseconds,
              "opacity-60",
            )}
          />
        </div>
      </div>

      <TimerMeta
        totalTime={totalTime}
        priceFormatted={priceFormatted}
        showPrice={showPrice}
        enableCopy={enableCopy}
        isRunning={isRunning}
        metaClass={fluid ? FLUID.meta : s.meta}
        priceClass={fluid ? FLUID.meta : s.price}
      />
    </div>
  );
}
