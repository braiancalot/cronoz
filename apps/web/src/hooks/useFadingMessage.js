import { useCallback, useEffect, useRef, useState } from "react";

export function useFadingMessage(visibleMs) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showMessage = useCallback(
    (nextMessage) => {
      clearTimeout(timerRef.current);
      setMessage(nextMessage);
      timerRef.current = setTimeout(() => setMessage(null), visibleMs);
    },
    [visibleMs],
  );

  return [message, showMessage];
}
