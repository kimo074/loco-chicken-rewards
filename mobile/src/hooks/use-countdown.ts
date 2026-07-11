import { useEffect, useState } from "react";

export function useCountdown(expiresAt: string | null) {
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setMsRemaining(null);
      return;
    }
    const target = new Date(expiresAt).getTime();
    const tick = () => setMsRemaining(Math.max(0, target - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (msRemaining === null) return { label: "", expired: false };

  const totalSeconds = Math.ceil(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { label, expired: msRemaining <= 0 };
}
