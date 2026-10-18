import { CopyIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useHidePrice } from "@/hooks/useHidePrice.js";
import { copyWithToast } from "@/lib/clipboard.js";
import { summarizeRealTime } from "@/lib/realTime.js";
import { formatHms } from "@/lib/stopwatch.js";
import { cn } from "@/lib/utils.js";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// The difference goes both ways: edits can add time or remove it.
function signOf(value, signed) {
  if (!signed || value === 0) return "";
  return value > 0 ? "+" : "−";
}

function Row({
  label,
  hint,
  time,
  price,
  fraction = false,
  signed = false,
  emphasized = false,
  copyLabel,
}) {
  const hidePrice = useHidePrice();
  const valueClass = emphasized ? "font-medium" : "text-muted-foreground";
  const prefix = signOf(time, signed);
  const timeText = formatHms(Math.abs(time), { fraction });
  const copyText = hidePrice ? timeText : `${timeText} (${brl.format(price)})`;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>

      <div className="flex items-center gap-3 tabular-nums">
        <span className={valueClass}>{`${prefix}${timeText}`}</span>
        {!hidePrice && (
          <span className={cn(valueClass, emphasized && "text-primary")}>
            {`${prefix}${brl.format(Math.abs(price))}`}
          </span>
        )}

        {copyLabel ? (
          <Button
            variant="ghost"
            size="icon-xs"
            title={`Copiar ${copyLabel.toLowerCase()}`}
            onClick={() => copyWithToast(copyText, copyLabel)}
          >
            <CopyIcon />
          </Button>
        ) : (
          // Reserve the copy button's width so button-less rows stay aligned.
          <span aria-hidden className="size-7" />
        )}
      </div>
    </div>
  );
}

export function RealTimeDialog({
  open,
  onOpenChange,
  stopwatch,
  hourlyPrice,
  ignoreMs,
}) {
  const summary = summarizeRealTime(stopwatch, hourlyPrice, { ignoreMs });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tempo real</DialogTitle>
          <DialogDescription>
            Quanto o cronômetro rodou de fato, sem ajustes, descartes nem voltas
            apagadas.
          </DialogDescription>
        </DialogHeader>

        {summary.real && (
          <div className="flex flex-col gap-4">
            <Row
              label="Em uso"
              time={summary.inUse.time}
              price={summary.inUse.price}
              fraction={!ignoreMs}
              copyLabel="Tempo em uso"
            />
            <Row
              label="Real"
              time={summary.real.time}
              price={summary.real.price}
              fraction
              emphasized
              copyLabel="Tempo real"
            />
            <Row
              label="Diferença"
              time={summary.difference.time}
              price={summary.difference.price}
              fraction
              signed
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
