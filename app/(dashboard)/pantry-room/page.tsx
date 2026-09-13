import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { PantryStatusCard } from "./PantryStatusCard";
import { WashingMachinesSection } from "./WashingMachinesSection";

export default async function PantryRoomPage() {
  const { user, profile } = await getSessionProfile();
  const supabase = await createClient();

  const [{ data: rooms }, { data: machines }, { data: slots }] =
    await Promise.all([
      supabase.from("pantry_room").select("*").order("id"),
      supabase.from("washing_machines").select("*").order("machine_code"),
      supabase.from("washing_machine_slots").select("*").order("id"),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Hostel Facilities</h1>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Pantry Room
        </h2>
        {(rooms ?? []).map((room) => (
          <PantryStatusCard
            key={room.id}
            initialRoom={room}
            currentUserId={user?.id ?? ""}
            role={profile?.role}
          />
        ))}
        {(rooms ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No pantry room configured yet.
          </p>
        )}
      </div>

      <WashingMachinesSection
        machines={machines ?? []}
        slots={slots ?? []}
        currentUserId={user?.id ?? ""}
        role={profile?.role}
      />
    </div>
  );
}
