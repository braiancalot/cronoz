import { CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { formatHms, summarizeExactTime } from "@/lib/stopwatch.js";
import { cn } from "@/lib/utils.js";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function Row({
  label,
  hint,
  time,
  price,
  fraction = false,
  prefix = "",
  emphasized = false,
  copyable = false,
}) {
  const valueClass = emphasized ? "font-medium" : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>

      <div className="flex items-center gap-3 tabular-nums">
        <span className={valueClass}>
          {`${prefix}${formatHms(time, { fraction })}`}
        </span>
        <span className={cn(valueClass, emphasized && "text-primary")}>
          {`${prefix}${brl.format(price)}`}
        </span>

        {copyable ? (
          <Button
            variant="ghost"
            size="icon-xs"
            title={`Copiar ${label}`}
            onClick={() => {
              navigator.clipboard.writeText(
                `${formatHms(time, { fraction })} (${brl.format(price)})`,
              );
              toast(`${label} copiado`, { position: "top-center" });
            }}
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

export function ExactTimeDialog({
  open,
  onOpenChange,
  stopwatch,
  hourlyPrice,
}) {
  const { rounded, exact, difference } = summarizeExactTime(
    stopwatch,
    hourlyPrice,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tempo exato</DialogTitle>
          <DialogDescription>
            Como o total ficaria sem arredondar os milissegundos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Row
            label="Arredondado"
            hint="em uso"
            time={rounded.time}
            price={rounded.price}
            copyable
          />
          <Row
            label="Exato"
            time={exact.time}
            price={exact.price}
            fraction
            emphasized
            copyable
          />
          <Row
            label="Diferença"
            time={difference.time}
            price={difference.price}
            fraction
            prefix="+"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
