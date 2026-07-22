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
import { Card, CardContent } from "@/components/ui/card.jsx";
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
export function LapNameForm({ value, onChange, onSubmit, onCancel }) {
  const { formProps, fieldProps, keepFocus } = useInlineEditForm({
    value,
    onSubmit,
    onCancel,
  });

  return (
    <form {...formProps} className="flex items-center gap-2 min-h-11 w-full">
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

// One lap = one card, matching the project cards on the home screen but with a
// tighter vertical padding, since the list can get long.
function LapCard({ className, children }) {
  return (
    <Card className={cn("gap-0 rounded-xl py-1.5", className)}>
      <CardContent className="flex items-center gap-3 px-4">
        {children}
      </CardContent>
    </Card>
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
      <LapCard>
        <LapNameForm
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          onCancel={handleCancel}
        />
      </LapCard>
    );
  }

  return (
    <LapCard>
      <div className="min-w-0 flex-1 flex items-center overflow-hidden">
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
        className="cursor-pointer flex items-center justify-end w-20"
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
        className="cursor-pointer flex items-center justify-end w-20"
      >
        <FormattedTime time={lapTime} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
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
    </LapCard>
  );
}

export function Laps({
  laps,
  onRenameLap,
  onDeleteLap,
  isAddingLap = false,
  addLapName = "",
  onAddLapNameChange,
  onConfirmAddLap,
  onCancelAddLap,
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

  const list = (
    // Each lap is its own card, matching the project cards on the home screen.
    // Past the height the stage gives it the ScrollArea scrolls, so the laps
    // never push the page into an outer scroll. Width, height and vertical
    // spacing are the stage's call, not ours.
    <div className={cn("flex flex-col min-h-0 w-full", className)}>
      <ScrollArea type="auto" className="flex-1 min-h-0">
        <div className="flex flex-col gap-1 py-0.5 w-full">
          {isAddingLap && (
            <LapCard>
              <LapNameForm
                value={addLapName}
                onChange={onAddLapNameChange}
                onSubmit={onConfirmAddLap}
                onCancel={onCancelAddLap}
              />
            </LapCard>
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
    </div>
  );

  return (
    <>
      {list}

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
