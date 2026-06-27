import { createPortal } from "react-dom";

export function PiPTimer({ pipWindow, children }) {
  if (!pipWindow) return null;

  return createPortal(
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {children}
    </div>,
    pipWindow.document.body,
  );
}
