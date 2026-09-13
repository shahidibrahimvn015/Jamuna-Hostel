"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Countdown({
  endTime,
  onExpire,
}: {
  endTime: string;
  onExpire?: () => void;
}) {
  // Starts null rather than Date.now(): the server renders this too, and a
  // clock-derived first render never matches the client's, which threw
  // "Hydration failed because the server rendered text didn't match" and made
  // React throw away and re-render the tree. Both sides now agree on the
  // placeholder, and the real time appears once mounted.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (now !== null && now >= new Date(endTime).getTime()) {
      onExpire?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, endTime]);

  if (now === null) return <span>--:--</span>;

  return <span>{formatRemaining(new Date(endTime).getTime() - now)}</span>;
}
