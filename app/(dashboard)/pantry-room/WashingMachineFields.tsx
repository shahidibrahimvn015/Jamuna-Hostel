"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WASHING_FLOORS, WASHING_MODELS } from "@/lib/constants/washing";
import type { Database } from "@/lib/types/database.types";

type Machine = Database["public"]["Tables"]["washing_machines"]["Row"];

// Native <select> rather than the ui/select primitive: these live inside plain
// <form action={...}> submissions, and a native control is guaranteed to put
// its value in the FormData.
const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MachineFormFields({ machine }: { machine?: Machine }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="machine_code">Machine ID</Label>
        <Input
          id="machine_code"
          name="machine_code"
          placeholder="WM-1"
          defaultValue={machine?.machine_code}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="floor">Floor</Label>
        <select
          id="floor"
          name="floor"
          defaultValue={machine?.floor ?? "ground"}
          className={selectClass}
        >
          {WASHING_FLOORS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="model">Model</Label>
        <select
          id="model"
          name="model"
          defaultValue={machine?.model ?? "automatic"}
          className={selectClass}
        >
          {WASHING_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Automatic has one 90 min wash. Semi-automatic has a 60 min washer and
          a 30 min dryer, bookable separately.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={machine?.status ?? "working"}
          className={selectClass}
        >
          <option value="working">Working</option>
          <option value="maintenance">Under maintenance</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Marking a machine under maintenance frees anyone currently on it.
        </p>
      </div>
    </div>
  );
}
