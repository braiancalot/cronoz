import { cn } from "@/lib/utils.js";

export function PageContainer({ className, children }) {
  return (
    <main className={cn("w-full h-dvh flex flex-col px-8", className)}>
      {children}
    </main>
  );
}
