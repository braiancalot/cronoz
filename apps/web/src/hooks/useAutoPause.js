import { useEffect, useRef } from "react";

export function useAutoPause(pause) {
  const pauseRef = useRef(pause);

  useEffect(() => {
    pauseRef.current = pause;
  }, [pause]);

  useEffect(() => {
    const handlePageHide = () => {
      pauseRef.current();
    };

    const handleVisibilityChange = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && document.visibilityState === "hidden") {
        pauseRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      pauseRef.current();
    };
  }, []);
}
