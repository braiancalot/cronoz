import { useCallback, useEffect, useRef, useState } from "react";
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
  const pipWindowRef = useRef(null);
  const onPageHideRef = useRef(null);

  const openPiP = useCallback(async () => {
    if (!isSupported || pipWindowRef.current) return;

    const win = await window.documentPictureInPicture.requestWindow({
      width: 200,
      height: 160,
    });

    copyStyles(win);
    // pagehide fires while the PiP document is still alive. flushSync unmounts
    // the portal synchronously here, before the window is destroyed — otherwise
    // React commits the removal against a dead document and crashes the main
    // tree (start/pause stop working in the opener window).
    const onPageHide = () => {
      pipWindowRef.current = null;
      onPageHideRef.current = null;
      flushSync(() => setPipWindow(null));
    };
    win.addEventListener("pagehide", onPageHide);
    pipWindowRef.current = win;
    onPageHideRef.current = onPageHide;
    setPipWindow(win);
  }, []);

  const closePiP = useCallback(() => {
    const win = pipWindowRef.current;
    if (!win) return;
    win.removeEventListener("pagehide", onPageHideRef.current);
    pipWindowRef.current = null;
    onPageHideRef.current = null;
    flushSync(() => setPipWindow(null));
    win.close();
  }, []);

  // The browser's PiP window outlives the React component that fills it. When
  // the owner unmounts (e.g. navigating away from the project), close it so it
  // doesn't linger as an empty/black floating window. Drop the pagehide
  // listener first so its flushSync doesn't run against the torn-down tree.
  useEffect(() => {
    return () => {
      const win = pipWindowRef.current;
      if (!win) return;
      win.removeEventListener("pagehide", onPageHideRef.current);
      win.close();
    };
  }, []);

  return { isSupported, pipWindow, openPiP, closePiP };
}
