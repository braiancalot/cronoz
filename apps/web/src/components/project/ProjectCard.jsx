import { Link } from "react-router";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
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

export function ProjectCard({
  project,
  onToggleComplete,
  onDelete,
  className = "",
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const { menuProps, triggerProps } = useTapOnlyDropdown();
  const displayTime = calculateTotalTime(project.stopwatch, { ignoreMs });
  const isCompleted = project.completedAt !== null;
  // Running with a fresh heartbeat means it's ticking somewhere — almost always
  // another device, since leaving for the Home screen pauses the local run.
  const isLive = isStopwatchLive(project.stopwatch);

  return (
    // Roomier than a lap card, same family: one step of padding above it,
    // and the size="sm" preset is skipped so the padding is a plain class
    // instead of a data-[size] one the merge can't override.
    <Card className={cn("relative rounded-xl py-2", className)}>
      {/* Stretched link: covers the row so the whole card navigates, but as a
          sibling of CardContent rather than its wrapper — nesting the menu
          button inside the link made the whole card flash :active on a menu
          tap, since :active hit-tests geometrically and ignores stopPropagation. */}
      <Link
        to={`/project/${project.id}`}
        aria-label={project.name}
        className="absolute inset-0 rounded-xl hover:bg-accent active:bg-accent/80 transition-colors"
      />
      <CardContent className="relative flex justify-between items-center px-4 pointer-events-none">
        <span className="flex items-center gap-2 min-w-0">
          {isLive && (
            <span
              role="status"
              aria-label="Ativo em outro dispositivo"
              title="Ativo em outro dispositivo"
              className="size-2 shrink-0 rounded-full bg-primary animate-pulse"
            />
          )}
          <span className="truncate">{project.name}</span>
        </span>
        <div className="flex items-center gap-2">
          <FormattedTime time={displayTime} />
          <DropdownMenu {...menuProps}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Mais opções"
                className="pointer-events-auto"
                {...triggerProps}
              >
                <DotsThreeVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="complete"
                onSelect={() => onToggleComplete(project)}
              >
                {isCompleted ? (
                  <ArrowCounterClockwiseIcon />
                ) : (
                  <CheckCircleIcon />
                )}
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
        </div>
      </CardContent>
    </Card>
  );
}
