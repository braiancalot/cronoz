import { XIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge.jsx";
import { tagColor } from "@/lib/tagColors.js";
import { cn } from "@/lib/utils.js";

export function TagChip({ name, className, onRemove }) {
  const color = tagColor(name);
  const chipClassName = cn(
    "max-w-40 bg-transparent",
    onRemove &&
      "gap-1 outline-none hover:brightness-125 focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );
  const style = {
    backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
    color,
  };

  if (onRemove) {
    return (
      <Badge asChild className={chipClassName} style={style}>
        <button
          type="button"
          aria-label={`Remover tag ${name}`}
          onClick={() => onRemove(name)}
        >
          <span className="truncate leading-tight">{name}</span>
          <XIcon
            className="size-3 shrink-0 translate-y-px"
            aria-hidden="true"
          />
        </button>
      </Badge>
    );
  }

  return (
    <Badge className={chipClassName} style={style}>
      <span className="truncate">{name}</span>
    </Badge>
  );
}
