import { Card, CardContent } from "@/components/ui/card.jsx";
import { cn } from "@/lib/utils.js";

export function LapCard({ className, children }) {
  return (
    <Card className={cn("gap-0 rounded-xl py-0.5", className)}>
      <CardContent className="flex items-center gap-3 px-4">
        {children}
      </CardContent>
    </Card>
  );
}
