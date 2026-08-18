import { CheckCircleIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button.jsx";
import { FilterChip } from "@/components/ui/filter-chip.jsx";
import { tagColor } from "@/lib/tagColors.js";
import { cn } from "@/lib/utils.js";

export function ProjectFilters({
  tags,
  selectedTagKeys,
  completedOnly,
  onToggleTag,
  onToggleCompleted,
  onClear,
  className,
}) {
  const hasFilters = selectedTagKeys.length > 0 || completedOnly;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div className="min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="flex w-max items-center gap-2">
          <FilterChip selected={completedOnly} onClick={onToggleCompleted}>
            <CheckCircleIcon
              className="size-3.5"
              weight={completedOnly ? "fill" : "regular"}
            />
            Concluídos
          </FilterChip>

          {tags.map((tag) => (
            <FilterChip
              key={tag.key}
              color={tagColor(tag.name)}
              selected={selectedTagKeys.includes(tag.key)}
              onClick={() => onToggleTag(tag.key)}
            >
              {tag.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="xs"
          pressEffect="none"
          className="h-[30px]! px-2! text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onClear}
        >
          <span className="flex items-center gap-1 leading-none">
            <XIcon
              className="size-3 shrink-0 translate-y-px"
              aria-hidden="true"
            />
            <span className="leading-none">Limpar</span>
          </span>
        </Button>
      )}
    </div>
  );
}
