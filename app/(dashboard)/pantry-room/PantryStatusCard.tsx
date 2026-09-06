"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Countdown } from "@/components/Countdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";
import { occupyPantryRoom, releasePantryRoom } from "./actions";

type PantryRoom = Database["public"]["Tables"]["pantry_room"]["Row"];

const MAX_DURATION_MINUTES = 60;

export function PantryStatusCard({
  initialRoom,
  currentUserId,
  role,
}: {
  initialRoom: PantryRoom;
  currentUserId: string;
  role: Role | null | undefined;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reconciledRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pantry_room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pantry_room",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          reconciledRef.current = false;
          setRoom(payload.new as PantryRoom);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  const isFree = room.status === "free";
  const canUpdate = role === "resident" || role === "admin";
  const isMine = room.occupied_by === currentUserId;
  const canRelease = !isFree && (isMine || role === "admin");

  function handleExpire() {
    if (reconciledRef.current || room.status !== "occupied") return;
    reconciledRef.current = true;
    startTransition(async () => {
      const result = await releasePantryRoom(room.id);
      if (result.room) setRoom(result.room);
    });
  }

  return (
    <Card className="max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{room.label}</CardTitle>
        <Badge variant={isFree ? "secondary" : "default"}>
          {isFree ? "Free" : "Occupied"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {room.location && (
          <p className="text-sm text-muted-foreground">{room.location}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Note: occupy the pantry room for up to 60 minutes. It automatically
          shows as free again once your time is up.
        </p>

        {!isFree && (
          <p className="text-sm">
            Occupied by{" "}
            <span className="font-mono">
              {room.occupied_by_roll_number ?? "unknown"}
            </span>
            {isMine && " (you)"}
          </p>
        )}

        {!isFree && room.end_time && (
          <p className="text-sm">
            Free in{" "}
            <span className="font-mono">
              <Countdown endTime={room.end_time} onExpire={handleExpire} />
            </span>
          </p>
        )}

        {isFree && canUpdate && (
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="duration">Duration (max 60 min)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={MAX_DURATION_MINUTES}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await occupyPantryRoom(room.id, duration);
                  if (result.error) setError(result.error);
                  if (result.room) setRoom(result.room);
                });
              }}
            >
              Occupy
            </Button>
          </div>
        )}

        {isFree && !canUpdate && (
          <p className="text-sm text-muted-foreground">
            Only residents can occupy the pantry room.
          </p>
        )}

        {canRelease && (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await releasePantryRoom(room.id);
                if (result.error) setError(result.error);
                if (result.room) setRoom(result.room);
              });
            }}
          >
            Release now
          </Button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
