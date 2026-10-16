import { CheckCircleIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button.jsx";
import { FilterChip } from "@/components/ui/filter-chip.jsx";
import { useRevealAfterRender } from "@/hooks/useRevealAfterRender.js";
import { useScrollEdges } from "@/hooks/useScrollEdges.js";
import { tagColor } from "@/lib/tagColors.js";
import { cn } from "@/lib/utils.js";

export function ProjectFilters({
  tags,
  selectedTagKeys,
  completedOnly,
  showCompletedFilter = true,
  onToggleTag,
  onToggleCompleted,
  onClear,
  className,
}) {
  const hasFilters = selectedTagKeys.length > 0 || completedOnly;
  const { scrollerRef, edges } = useScrollEdges();
  const revealAfterRender = useRevealAfterRender();

  // Selecting brings in "Limpar", which narrows the scroller and can push the
  // chip just tapped under the edge.
  function toggleAndReveal(event, toggle) {
    revealAfterRender(event.currentTarget);
    toggle();
  }

  // Bleeds past the page gutter so chips scroll to the screen edge.
  return (
    <div
      className={cn(
        "-mx-4 flex min-w-0 items-center gap-2 md:-mx-8",
        className,
      )}
    >
      <div
        ref={scrollerRef}
        data-overflow-start={edges.start || undefined}
        data-overflow-end={edges.end || undefined}
        className={cn(
          "scroll-edge-fade scroll-px-8 min-w-0 flex-1 overflow-x-auto overscroll-x-contain pl-4 [scrollbar-width:none] md:pl-8 [&::-webkit-scrollbar]:hidden",
          !hasFilters && "pr-4 md:pr-8",
        )}
      >
        <div className="flex w-max items-center gap-2">
          {showCompletedFilter && (
            <FilterChip
              selected={completedOnly}
              onClick={(event) => toggleAndReveal(event, onToggleCompleted)}
            >
              <CheckCircleIcon
                className="size-3.5"
                weight={completedOnly ? "fill" : "regular"}
              />
              Concluídos
            </FilterChip>
          )}

          {tags.map((tag) => (
            <FilterChip
              key={tag.key}
              color={tagColor(tag.name)}
              selected={selectedTagKeys.includes(tag.key)}
              onClick={(event) =>
                toggleAndReveal(event, () => onToggleTag(tag.key))
              }
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
          className="mr-4 h-[30px]! px-2! text-muted-foreground md:mr-8 focus-visible:ring-2 focus-visible:ring-ring"
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
