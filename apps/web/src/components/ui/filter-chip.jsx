import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

function FilterChip({
  selected = false,
  color,
  className,
  style,
  type = "button",
  children,
  ...props
}) {
  const foreground =
    color ?? (selected ? "var(--primary)" : "var(--muted-foreground)");
  const tone = color ?? (selected ? "var(--primary)" : "var(--muted)");
  const strengths = color
    ? selected
      ? [28, 32, 36]
      : [12, 18, 22]
    : selected
      ? [20, 25, 30]
      : [60, 80, 100];
  const [restStrength, hoverStrength, activeStrength] = strengths;

  return (
    <Button
      type={type}
      variant="ghost"
      size="xs"
      pressEffect="none"
      aria-pressed={selected}
      className={cn(
        "h-[30px]! appearance-none border-2! bg-[var(--filter-chip-bg)]! bg-clip-border! px-3! transition-[background-color,border-color]! hover:bg-[var(--filter-chip-hover-bg)]! active:bg-[var(--filter-chip-active-bg)]! focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={{
        color: foreground,
        borderColor: selected
          ? `color-mix(in oklch, ${tone} 70%, transparent)`
          : "transparent",
        "--filter-chip-bg": `color-mix(in oklch, ${tone} ${restStrength}%, transparent)`,
        "--filter-chip-hover-bg": `color-mix(in oklch, ${tone} ${hoverStrength}%, transparent)`,
        "--filter-chip-active-bg": `color-mix(in oklch, ${tone} ${activeStrength}%, transparent)`,
        ...style,
      }}
      {...props}
    >
      <span className="flex items-center gap-1.5 leading-none">{children}</span>
    </Button>
  );
}

export { FilterChip };
