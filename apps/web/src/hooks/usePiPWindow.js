import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

const isSupported =
  typeof window !== "undefined" && "documentPictureInPicture" in window;

// The PiP window starts with an empty document, so it doesn't inherit the
// main page's styles. Clone every stylesheet (and the body's theme classes)
// so Tailwind renders the same way inside the floating window.
function copyStyles(pipWindow) {
  for (const styleSheet of document.styleSheets) {
    try {
      const cssText = [...styleSheet.cssRules].map((r) => r.cssText).join("");
      const style = document.createElement("style");
      style.textContent = cssText;
      pipWindow.document.head.appendChild(style);
    } catch {
      // Cross-origin sheets throw on cssRules; re-link them instead.
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = styleSheet.type;
      link.media = styleSheet.media;
      link.href = styleSheet.href;
      pipWindow.document.head.appendChild(link);
    }
  }

  pipWindow.document.documentElement.className =
    document.documentElement.className;
  pipWindow.document.body.className = document.body.className;
}

export function usePiPWindow() {
  const [pipWindow, setPipWindow] = useState(null);

  const openPiP = useCallback(async () => {
    if (!isSupported || pipWindow) return;

    const win = await window.documentPictureInPicture.requestWindow({
      width: 200,
      height: 160,
    });

    copyStyles(win);
    // pagehide fires while the PiP document is still alive. flushSync unmounts
    // the portal synchronously here, before the window is destroyed — otherwise
    // React commits the removal against a dead document and crashes the main
    // tree (start/pause stop working in the opener window).
    win.addEventListener("pagehide", () => {
      flushSync(() => setPipWindow(null));
    });
    setPipWindow(win);
  }, [pipWindow]);

  const closePiP = useCallback(() => {
    if (!pipWindow) return;
    flushSync(() => setPipWindow(null));
    pipWindow.close();
  }, [pipWindow]);

  return { isSupported, pipWindow, openPiP, closePiP };
}
