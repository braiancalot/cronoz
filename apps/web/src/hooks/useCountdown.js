import { useEffect, useState } from "react";

export function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return Math.max(0, deadline - now);
}
