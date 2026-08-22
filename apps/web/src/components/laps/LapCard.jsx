import { Card, CardContent } from "@/components/ui/card.jsx";
import { FLOATING_MENU_MIN_HEIGHT } from "@/lib/floatingMenuLayout.js";
import { cn } from "@/lib/utils.js";

export function LapCard({ className, menu, children }) {
  return (
    <Card
      className={cn(
        "relative gap-0 rounded-xl py-0",
        FLOATING_MENU_MIN_HEIGHT,
        className,
      )}
    >
      {menu}
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}
