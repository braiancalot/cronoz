import { useEffect } from "react";

export function useAutoPause(pause) {
  useEffect(() => {
    const handlePageHide = () => {
      pause();
    };

    const handleVisibilityChange = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && document.visibilityState === "hidden") {
        pause();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [pause]);
}
