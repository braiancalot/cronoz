import { cn } from "@/lib/utils.js";

export function PageContainer({ className, children }) {
  return (
    <main
      className={cn("w-full h-dvh flex flex-col px-4 md:px-8", className)}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {children}
    </main>
  );
}
