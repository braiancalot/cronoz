import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.jsx";
import { useLongPress } from "@/hooks/useLongPress.js";

export function LapName({ children }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const ref = useRef(null);

  const isTruncated = () => {
    const el = ref.current;
    return !!el && el.scrollWidth > el.offsetWidth;
  };

  const longPressHandlers = useLongPress(() => {
    if (isTruncated()) toast(children, { position: "top-center" });
  });

  return (
    <Tooltip
      open={tooltipOpen}
      onOpenChange={(open) => setTooltipOpen(open && isTruncated())}
    >
      <TooltipTrigger asChild>
        {/* min-w-0 is what makes truncate work: without it a flex item refuses
            to shrink past its longest word. */}
        <span
          ref={ref}
          className="min-w-0 flex-1 truncate select-none [-webkit-touch-callout:none]"
          onContextMenu={(e) => e.preventDefault()}
          {...longPressHandlers}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
