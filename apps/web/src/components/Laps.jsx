import { useCallback, useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { Card } from "@/components/ui/card.jsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useInlineEditForm } from "@/hooks/useInlineEditForm.js";
import { useInlineRename } from "@/hooks/useInlineRename.js";
import { useLongPress } from "@/hooks/useLongPress.js";
import { formatTimeCompact, truncateToSecond } from "@/lib/stopwatch.js";
import { showUndoToast } from "@/lib/undoToast.js";
import { cn } from "@/lib/utils.js";
import { toast } from "sonner";

// Inline name editor for a lap row (rename or add). Explicit ✕/✓ buttons let it
// be saved with the mouse alone, not just Enter. Behavior lives in
// useInlineEditForm; this owns only the compact-row layout.
function LapNameForm({ value, onChange, onSubmit, onCancel }) {
  const { formProps, fieldProps, keepFocus } = useInlineEditForm({
    value,
    onSubmit,
    onCancel,
  });

  return (
    <form
      {...formProps}
      className="col-span-full flex items-center gap-2 min-h-9"
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...fieldProps}
        className="flex-1 h-8 text-sm"
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        {...keepFocus}
        onClick={onCancel}
        aria-label="Cancelar"
        title="Cancelar"
      >
        <XIcon weight="bold" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        className="rounded-full"
        {...keepFocus}
        onClick={onSubmit}
        aria-label="Salvar"
        title="Salvar"
      >
        <CheckIcon weight="bold" />
      </Button>
    </form>
  );
}

function LapItem({ lap, lapTime, cumulativeTime, onRename, onRequestDelete }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const nameRef = useRef(null);

  const handleRenameLap = useCallback(
    (name) => onRename(lap.id, name),
    [onRename, lap.id],
  );

  const {
    isEditing: isRenaming,
    draft,
    setDraft,
    displayName,
    start: handleStartRename,
    cancel: handleCancel,
    submit,
  } = useInlineRename(lap.name, handleRenameLap);

  const isTruncated = () => {
    const el = nameRef.current;
    return !!el && el.scrollWidth > el.offsetWidth;
  };

  const longPressHandlers = useLongPress(() => {
    if (isTruncated()) toast(displayName, { position: "top-center" });
  });

  async function copyToClipboard(text, label) {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`, { position: "top-center" });
  }

  if (isRenaming) {
    return (
      <LapNameForm
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <>
      <div className="min-h-9 min-w-0 flex items-center overflow-hidden">
        <Tooltip
          open={tooltipOpen}
          onOpenChange={(open) => setTooltipOpen(open && isTruncated())}
        >
          <TooltipTrigger asChild>
            <span
              ref={nameRef}
              className="truncate select-none [-webkit-touch-callout:none]"
              onContextMenu={(e) => e.preventDefault()}
              {...longPressHandlers}
            >
              {displayName}
            </span>
          </TooltipTrigger>
          <TooltipContent>{displayName}</TooltipContent>
        </Tooltip>
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(formatTimeCompact(cumulativeTime), "Tempo acumulado");
        }}
        className="cursor-pointer flex items-center min-h-9 justify-end"
      >
        <FormattedTime
          time={cumulativeTime}
          className="text-muted-foreground"
        />
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(formatTimeCompact(lapTime), "Tempo da volta");
        }}
        className="cursor-pointer flex items-center min-h-9 justify-end"
      >
        <FormattedTime time={lapTime} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            title="Mais opções"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsThreeVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="info"
            onSelect={() =>
              copyToClipboard(
                `${formatTimeCompact(cumulativeTime)} (${formatTimeCompact(lapTime)})`,
                "Tempos",
              )
            }
          >
            <CopyIcon />
            Copiar tempos
          </DropdownMenuItem>
          <DropdownMenuItem variant="edit" onSelect={handleStartRename}>
            <PencilSimpleIcon />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onRequestDelete(lap)}
          >
            <TrashIcon />
            Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

// Fades the top/bottom edges so a clipped row hints "there's more", reinforcing
// the scrollbar as a scroll cue.
const SCROLL_FADE =
  "[mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%_-_12px),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%_-_12px),transparent)]";

export function Laps({
  laps,
  onRenameLap,
  onDeleteLap,
  isAddingLap = false,
  addLapName = "",
  onAddLapNameChange,
  onConfirmAddLap,
  onCancelAddLap,
  reserve = false,
  className,
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const activeLaps = laps?.filter((lap) => !lap.deletedAt);
  const [pendingDelete, setPendingDelete] = useState(null);

  const cumulativeByLapId = new Map();
  let acc = 0;
  for (let i = (activeLaps?.length ?? 0) - 1; i >= 0; i--) {
    const lap = activeLaps[i];
    acc += ignoreMs ? truncateToSecond(lap.lapTime) : lap.lapTime;
    cumulativeByLapId.set(lap.id, acc);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    const { undo } = await onDeleteLap(id);
    showUndoToast(`Volta "${name}" excluída`, undo);
  }

  const card = (
    <Card
      className={cn(
        "w-full max-w-125 py-0 min-h-12 max-h-54",
        // The card hugs its content up to a fixed cap, then scrolls. In reserve
        // mode a same-height region holds that cap so the card can grow down
        // into it without pushing the timer (hence no outer margin here).
        reserve ? "my-0" : "my-6",
        className,
      )}
    >
      <ScrollArea
        type="auto"
        className="flex-1 min-h-0"
        viewportClassName={SCROLL_FADE}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 gap-y-1 px-4 py-2 w-full">
          {isAddingLap && (
            <LapNameForm
              value={addLapName}
              onChange={onAddLapNameChange}
              onSubmit={onConfirmAddLap}
              onCancel={onCancelAddLap}
            />
          )}
          {activeLaps?.map((lap) => (
            <LapItem
              key={lap.id}
              lap={lap}
              lapTime={ignoreMs ? truncateToSecond(lap.lapTime) : lap.lapTime}
              cumulativeTime={cumulativeByLapId.get(lap.id)}
              onRename={onRenameLap}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );

  return (
    <>
      {reserve ? (
        <div className="flex w-full shrink-0 flex-col items-center h-54 my-6">
          {card}
        </div>
      ) : (
        card
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Apagar volta?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" será removida e seu tempo deixará de contar no total.`
            : ""
        }
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
