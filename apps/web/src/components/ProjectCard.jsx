import { Link } from "react-router";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { calculateTotalTime } from "@/lib/stopwatch.js";

export function ProjectCard({
  project,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <Link to={`/project/${project.id}`}>
      <div
        className={`flex justify-between items-center bg-card p-4 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors ${className}`}
      >
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
      </div>
    </Link>
  );
}
