import { cn } from "@/lib/utils.js";

export function PageContainer({ className, children }) {
  return (
    <main className={cn("w-full h-full flex flex-col px-4 md:px-8", className)}>
      {children}
    </main>
  );
}
