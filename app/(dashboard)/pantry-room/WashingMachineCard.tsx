"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/Countdown";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import type { Role } from "@/lib/auth/roles";
import { modelLabel, SLOT_LABELS } from "@/lib/constants/washing";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";
import { MachineFormFields } from "./WashingMachineFields";
import {
  deleteWashingMachine,
  occupyWashingSlot,
  releaseWashingSlot,
  updateWashingMachine,
} from "./washingActions";

type Machine = Database["public"]["Tables"]["washing_machines"]["Row"];
type Slot = Database["public"]["Tables"]["washing_machine_slots"]["Row"];

const actionButtonClass =
  "rounded-[10px] border border-black/10 bg-[#F5EFE4] text-[#422400] shadow-md hover:bg-[#ECE3D0] hover:text-[#422400]";
const inputClass =
  "rounded-[10px] border-white/50 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white";

// Washer before dryer on a semi-automatic, so the card reads in the order the
// machine is actually used.
const SLOT_ORDER: Record<string, number> = { wash: 0, washer: 0, dryer: 1 };

function EditMachineDialog({ machine }: { machine: Machine }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className={actionButtonClass} />
        }
      >
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {machine.machine_code}</DialogTitle>
        </DialogHeader>
        <form
          action={(formData) => {
            startTransition(async () => {
              const result = await updateWashingMachine(machine.id, formData);
              setError(result.error);
              if (!result.error) setOpen(false);
            });
          }}
          className="flex flex-col gap-3"
        >
          <MachineFormFields machine={machine} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteWashingMachine(machine.id);
                  setError(result.error);
                  if (!result.error) setOpen(false);
                });
              }}
            >
              Delete
            </Button>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SlotRow({
  slot,
  currentUserId,
  role,
  onChange,
}: {
  slot: Slot;
  currentUserId: string;
  role: Role | null | undefined;
  onChange: (slot: Slot) => void;
}) {
  // Half the cap, so the common case is one tap rather than editing down
  // from the maximum.
  const [duration, setDuration] = useState(
    Math.max(1, Math.round(slot.max_minutes / 2))
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reconciledRef = useRef(false);

  const isFree = slot.status === "free";
  const canUse = role === "resident" || role === "admin";
  const isMine = slot.occupied_by === currentUserId;
  const canRelease = !isFree && (isMine || role === "admin");

  // Fires from whichever viewer's countdown reaches zero first, usually not the
  // occupant. Both releaseWashingSlot and the 0015 guard allow releasing an
  // already-expired booking for exactly this reason.
  function handleExpire() {
    if (reconciledRef.current || slot.status !== "occupied") return;
    reconciledRef.current = true;
    startTransition(async () => {
      const result = await releaseWashingSlot(slot.id);
      if (result.slot) onChange(result.slot);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-white/20 pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{SLOT_LABELS[slot.slot]}</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ring-1",
            isFree
              ? "bg-emerald-400/30 ring-emerald-300/50"
              : "bg-white/90 text-[#422400] ring-white/40"
          )}
        >
          {isFree ? "Free - max " + slot.max_minutes + " min" : "In use"}
        </span>
      </div>

      {!isFree && (
        <p className="text-sm text-white/90">
          Used by{" "}
          <span className="font-mono">
            {slot.occupied_by_roll_number ?? "unknown"}
          </span>
          {isMine && " (you)"}
          {slot.end_time && (
            <>
              {" - free in "}
              <span className="font-mono">
                <Countdown endTime={slot.end_time} onExpire={handleExpire} />
              </span>
            </>
          )}
        </p>
      )}

      {isFree && canUse && (
        <div className="flex items-end gap-2">
          <Input
            type="number"
            min={1}
            max={slot.max_minutes}
            value={duration}
            aria-label={SLOT_LABELS[slot.slot] + " duration in minutes"}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={"w-20 " + inputClass}
          />
          <Button
            size="sm"
            disabled={isPending}
            className={actionButtonClass}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await occupyWashingSlot(slot.id, duration);
                if (result.error) setError(result.error);
                if (result.slot) onChange(result.slot);
              });
            }}
          >
            Occupy
          </Button>
        </div>
      )}

      {isFree && !canUse && (
        <p className="text-sm text-white/70">
          Only residents can use the washing machines.
        </p>
      )}

      {canRelease && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          className={"w-fit " + actionButtonClass}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await releaseWashingSlot(slot.id);
              if (result.error) setError(result.error);
              if (result.slot) onChange(result.slot);
            });
          }}
        >
          Release now
        </Button>
      )}

      {error && <p className="text-sm text-red-100">{error}</p>}
    </div>
  );
}

export function WashingMachineCard({
  machine,
  initialSlots,
  currentUserId,
  role,
}: {
  machine: Machine;
  initialSlots: Slot[];
  currentUserId: string;
  role: Role | null | undefined;
}) {
  const [slots, setSlots] = useState(initialSlots);
  const isAdmin = role === "admin";
  const underMaintenance = machine.status === "maintenance";
  // Supabase keys channels by name, and calling .on() on an already-subscribed
  // channel throws. Keying by machine id alone breaks the moment one machine is
  // rendered twice on a page, so the instance id keeps each card's channel its own.
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("washing_machine_slots-" + machine.id + "-" + instanceId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "washing_machine_slots",
          filter: "machine_id=eq." + machine.id,
        },
        (payload) => {
          const next = payload.new as Slot;
          setSlots((prev) => prev.map((s) => (s.id === next.id ? next : s)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [machine.id, instanceId]);

  const ordered = [...slots].sort(
    (a, b) => (SLOT_ORDER[a.slot] ?? 0) - (SLOT_ORDER[b.slot] ?? 0)
  );

  return (
    <div className="bg-brand-gradient flex max-w-md flex-col gap-3 rounded-2xl p-5 text-white shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">
            {machine.machine_code}
          </h3>
          <p className="text-sm text-white/80">{modelLabel(machine.model)}</p>
        </div>
        {isAdmin && <EditMachineDialog machine={machine} />}
      </div>

      {underMaintenance ? (
        <div className="rounded-[10px] bg-white/90 px-3 py-2 text-sm font-medium text-[#422400]">
          Under maintenance
        </div>
      ) : (
        ordered.map((slot) => (
          <SlotRow
            key={slot.id}
            slot={slot}
            currentUserId={currentUserId}
            role={role}
            onChange={(next) =>
              setSlots((prev) => prev.map((s) => (s.id === next.id ? next : s)))
            }
          />
        ))
      )}
    </div>
  );
}
