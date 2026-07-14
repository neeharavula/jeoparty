import { useEffect, useState } from "react";

export function useCountdown(
  revealedAt: string | null | undefined,
  durationSeconds: number,
) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!revealedAt) {
      setRemaining(durationSeconds);
      return;
    }

    function tick() {
      const elapsed = (Date.now() - new Date(revealedAt!).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(durationSeconds - elapsed)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [revealedAt, durationSeconds]);

  return remaining;
}
