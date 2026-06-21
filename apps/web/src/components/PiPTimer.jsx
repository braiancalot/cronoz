import { createPortal } from "react-dom";

export function PiPTimer({ pipWindow, children }) {
  if (!pipWindow) return null;

  return createPortal(
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-4 text-foreground">
      {children}
    </div>,
    pipWindow.document.body,
  );
}
