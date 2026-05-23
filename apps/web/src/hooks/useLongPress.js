import { useEffect, useRef } from "react";

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

export function useLongPress(onLongPress, { delay = LONG_PRESS_MS } = {}) {
  const callbackRef = useRef(onLongPress);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    callbackRef.current = onLongPress;
  }, [onLongPress]);

  const cancel = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    startRef.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      callbackRef.current?.(event);
    }, delay);
  };

  const handleTouchMove = (event) => {
    if (!startRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - startRef.current.x);
    const dy = Math.abs(touch.clientY - startRef.current.y);
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) cancel();
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onTouchMove: handleTouchMove,
  };
}
