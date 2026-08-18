import { Link } from "react-router";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  TagIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { DynamicTagRow } from "@/components/tag/DynamicTagRow.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.jsx";
import { calculateTotalTime, isStopwatchLive } from "@/lib/stopwatch.js";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useTapOnlyDropdown } from "@/hooks/useTapOnlyDropdown.js";
import { cn } from "@/lib/utils.js";

export const PROJECT_TIME_WIDTH = {
  short: "w-[5.5ch]",
  withHours: "w-[8.5ch]",
};

export function ProjectCard({
  project,
  timeWidth = PROJECT_TIME_WIDTH.withHours,
  onManageTags,
  onToggleComplete,
  onDelete,
  className = "",
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const { menuProps, triggerProps } = useTapOnlyDropdown();
  const displayTime = calculateTotalTime(project.stopwatch, { ignoreMs });
  const isCompleted = project.completedAt !== null;
  const tags = project.tags ?? [];
  const hasTags = tags.length > 0;
  // Running with a fresh heartbeat means it's ticking somewhere — almost always
  // another device, since leaving for the Home screen pauses the local run.
  const isLive = isStopwatchLive(project.stopwatch);

  return (
    <Card
      className={cn(
        "@container relative gap-0 rounded-2xl py-0",
        isCompleted && "bg-card/50",
        className,
      )}
    >
      <Link
        to={`/project/${project.id}`}
        aria-label={project.name}
        className="absolute inset-0 rounded-2xl transition-colors hover:bg-accent active:bg-accent/80"
      />

      <DropdownMenu {...menuProps}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Mais opções"
            className="pointer-events-auto absolute inset-y-0 right-2 my-auto shrink-0 text-muted-foreground active:text-foreground"
            {...triggerProps}
          >
            <DotsThreeVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onManageTags?.(project)}>
            <TagIcon className="size-4" />
            Tags
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="complete"
            onSelect={() => onToggleComplete(project)}
          >
            {isCompleted ? <ArrowCounterClockwiseIcon /> : <CheckCircleIcon />}
            {isCompleted ? "Reabrir" : "Concluir"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(project)}
          >
            <TrashIcon />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CardContent className="pointer-events-none relative p-4">
        <div className="flex items-center gap-3 pr-8">
          <div
            className={cn(
              hasTags
                ? "flex min-w-0 flex-1 flex-col gap-2 @min-[40rem]:contents"
                : "contents",
            )}
          >
            <span
              className={cn(
                "flex min-w-0 items-center gap-2 text-base font-semibold",
                !hasTags && "flex-1",
              )}
            >
              {isLive && (
                <span
                  role="status"
                  aria-label="Ativo em outro dispositivo"
                  title="Ativo em outro dispositivo"
                  className="size-2 shrink-0 animate-pulse rounded-full bg-primary"
                />
              )}
              <span className="truncate">{project.name}</span>
            </span>

            {hasTags && <DynamicTagRow tags={tags} />}
          </div>

          <FormattedTime
            time={displayTime}
            className={cn(
              "ml-auto shrink-0 justify-end text-lg leading-none text-muted-foreground",
              timeWidth,
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
