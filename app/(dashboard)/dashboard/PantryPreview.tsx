"use client";

import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/Countdown";
import type { Database } from "@/lib/types/database.types";

type PantryRoom = Database["public"]["Tables"]["pantry_room"]["Row"];

// Read-only glance at pantry occupancy for the dashboard home page — the
// full occupy/release controls live on the dedicated Hostel Facilities page.
export function PantryPreview({ rooms }: { rooms: PantryRoom[] }) {
  const [expired, setExpired] = useState<Record<number, boolean>>({});

  if (rooms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pantry room configured yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rooms.map((room) => {
        const isFree = room.status !== "occupied" || expired[room.id];
        return (
          <div
            key={room.id}
            className="bg-surface-2 flex items-center gap-3 rounded-xl border px-3 py-3"
          >
            <span className="bg-pantry/12 flex size-9 shrink-0 items-center justify-center rounded-full">
              <UtensilsCrossed className="text-pantry size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{room.label}</p>
              {!isFree && room.end_time ? (
                <p className="text-xs text-muted-foreground">
                  Free in{" "}
                  <span className="font-mono">
                    <Countdown
                      endTime={room.end_time}
                      onExpire={() =>
                        setExpired((prev) => ({ ...prev, [room.id]: true }))
                      }
                    />
                  </span>
                </p>
              ) : (
                room.location && (
                  <p className="text-xs text-muted-foreground">{room.location}</p>
                )
              )}
            </div>
            <Badge variant={isFree ? "secondary" : "default"}>
              {isFree ? "Free" : "Occupied"}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
