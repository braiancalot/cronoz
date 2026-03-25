import { Link } from "react-router";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { calculateTotalTime } from "@/lib/stopwatch.js";
import { cn } from "@/lib/utils.js";

export function ProjectCard({
  project,
  actionLabel,
  onAction,
  className = "",
}) {
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
            <FormattedTime time={calculateTotalTime(project.stopwatch)} />
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => onAction(e, project.id)}
            >
              {actionLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
