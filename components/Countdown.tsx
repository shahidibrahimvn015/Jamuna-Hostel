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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (now >= new Date(endTime).getTime()) {
      onExpire?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, endTime]);

  const remaining = new Date(endTime).getTime() - now;

  return <span>{formatRemaining(remaining)}</span>;
}
