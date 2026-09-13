import type { Role } from "@/lib/auth/roles";
import { WASHING_FLOORS } from "@/lib/constants/washing";
import type { Database } from "@/lib/types/database.types";
import { AddWashingMachineForm } from "./AddWashingMachineForm";
import { WashingMachineCard } from "./WashingMachineCard";

type Machine = Database["public"]["Tables"]["washing_machines"]["Row"];
type Slot = Database["public"]["Tables"]["washing_machine_slots"]["Row"];

export function WashingMachinesSection({
  machines,
  slots,
  currentUserId,
  role,
}: {
  machines: Machine[];
  slots: Slot[];
  currentUserId: string;
  role: Role | null | undefined;
}) {
  const isAdmin = role === "admin";

  // Grouped by WASHING_FLOORS order rather than by whatever order the rows came
  // back in, so "Ground Floor" leads and empty floors are skipped entirely.
  const byFloor = WASHING_FLOORS.map((floor) => ({
    ...floor,
    machines: machines.filter((m) => m.floor === floor.value),
  })).filter((group) => group.machines.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Washing Machines
      </h2>

      {byFloor.map((group) => (
        <div key={group.value} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {group.label}
          </h3>
          <div className="flex flex-col gap-4">
            {group.machines.map((machine) => (
              <WashingMachineCard
                key={machine.id}
                machine={machine}
                initialSlots={slots.filter((s) => s.machine_id === machine.id)}
                currentUserId={currentUserId}
                role={role}
              />
            ))}
          </div>
        </div>
      ))}

      {machines.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No washing machines added yet.
        </p>
      )}

      {isAdmin && <AddWashingMachineForm />}
    </div>
  );
}
