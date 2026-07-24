import { ArrowLeftIcon, PictureInPictureIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.jsx";
import { useInlineEditForm } from "@/hooks/useInlineEditForm.js";
import { useInlineRename } from "@/hooks/useInlineRename.js";
import { cn } from "@/lib/utils.js";
import { ProjectMenu } from "./ProjectMenu.jsx";
import { ProjectRenameActions } from "./ProjectRenameActions.jsx";
import { ProjectTitle } from "./ProjectTitle.jsx";

export function ProjectHeader({
  name,
  compact = false,
  onRename,
  onDelete,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
  onAdjust,
  canAdjust,
  onOpenPiP,
  onViewExactTime,
}) {
  const {
    isEditing: isRenaming,
    draft,
    setDraft,
    displayName,
    start: handleStartRename,
    cancel: handleCancel,
    submit,
  } = useInlineRename(name, onRename);

  const { formProps, fieldProps, keepFocus } = useInlineEditForm({
    value: draft,
    onSubmit: submit,
    onCancel: handleCancel,
  });

  return (
    <header
      className={cn(
        "w-full flex items-center justify-between gap-4 shrink-0",
        compact ? "h-12" : "h-16",
      )}
    >
      <div className="flex items-center gap-1 justify-start">
        {/* Padded to a 44px target, pulled left so it stays flush with the edge.
            z-30 clears the RunningOverlay: leaving the page auto-pauses on
            unmount, so this needs to navigate on the first tap, not pause. */}
        <Link to="/" className="-ml-3 p-3 relative z-30">
          <ArrowLeftIcon className="size-5" />
        </Link>

        <ProjectTitle
          isRenaming={isRenaming}
          name={displayName}
          draft={draft}
          onDraftChange={setDraft}
          formProps={formProps}
          fieldProps={fieldProps}
        />
      </div>

      <div className="flex items-center gap-1">
        {isRenaming ? (
          <ProjectRenameActions
            keepFocus={keepFocus}
            onCancel={handleCancel}
            onSubmit={submit}
          />
        ) : (
          <>
            {onOpenPiP && (
              <Button
                variant="ghost"
                size="icon"
                title="Abrir em janela flutuante"
                onClick={onOpenPiP}
                // z-30 clears the RunningOverlay: popping the timer out is not
                // meant to pause it.
                className="relative z-30"
              >
                <PictureInPictureIcon />
              </Button>
            )}

            <ProjectMenu
              onRename={handleStartRename}
              onAdjust={onAdjust}
              canAdjust={canAdjust}
              onViewExactTime={onViewExactTime}
              onDiscardCurrentTime={onDiscardCurrentTime}
              canDiscardCurrentTime={canDiscardCurrentTime}
              onDelete={onDelete}
            />
          </>
        )}
      </div>
    </header>
  );
}
