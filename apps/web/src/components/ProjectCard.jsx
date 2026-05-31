import { Link } from "react-router";
import { MoreVerticalIcon } from "lucide-react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.jsx";
import { calculateTotalTime, isStopwatchLive } from "@/lib/stopwatch.js";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { cn } from "@/lib/utils.js";

export function ProjectCard({
  project,
  onToggleComplete,
  onDelete,
  className = "",
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const displayTime = calculateTotalTime(project.stopwatch, { ignoreMs });
  const isCompleted = project.completedAt !== null;
  // Running with a fresh heartbeat means it's ticking somewhere — almost always
  // another device, since leaving for the Home screen pauses the local run.
  const isLive = isStopwatchLive(project.stopwatch);

  return (
    <Link to={`/project/${project.id}`}>
      <Card
        size="sm"
        className={cn(
          "hover:bg-accent active:bg-accent/80 transition-colors",
          className,
        )}
      >
        <CardContent className="flex justify-between items-center">
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
          <div className="flex items-center gap-4">
            <FormattedTime time={displayTime} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title="Mais opções"
                >
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onSelect={() => onToggleComplete(project)}>
                  {isCompleted ? "Reabrir" : "Concluir"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(project)}
                >
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
