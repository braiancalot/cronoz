import { TagChip } from "@/components/tag/TagChip.jsx";
import { useVisibleTagCount } from "@/hooks/useVisibleTagCount.js";
import { cn } from "@/lib/utils.js";

export function DynamicTagRow({ tags, className }) {
  const { containerRef, measureRef, visibleCount } = useVisibleTagCount(tags);

  if (tags.length === 0) return null;
  const hidden = tags.length - visibleCount;

  return (
    <div
      ref={containerRef}
      data-slot="project-tags"
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden",
        className,
      )}
    >
      {tags.slice(0, visibleCount).map((tag, index) => (
        <TagChip
          key={tag}
          name={tag}
          className={index === 0 && hidden > 0 ? "min-w-0 shrink" : undefined}
        />
      ))}
      {hidden > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          +{hidden}
        </span>
      )}

      <div
        ref={measureRef}
        data-slot="project-tags-measure"
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-center gap-1"
      >
        {tags.map((tag) => (
          <span key={tag} data-tag-measure className="inline-flex">
            <TagChip name={tag} />
          </span>
        ))}
        {tags.slice(0, -1).map((_, index) => {
          const count = index + 1;
          return (
            <span
              key={count}
              data-counter-for={count}
              className="text-xs text-muted-foreground"
            >
              +{tags.length - count}
            </span>
          );
        })}
      </div>
    </div>
  );
}
