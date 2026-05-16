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
import { calculateTotalTime } from "@/lib/stopwatch.js";
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
          <span>{project.name}</span>
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
