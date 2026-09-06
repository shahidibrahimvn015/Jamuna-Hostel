import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { PantryStatusCard } from "./PantryStatusCard";

export default async function PantryRoomPage() {
  const { user, profile } = await getSessionProfile();
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from("pantry_room")
    .select("*")
    .order("id");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Hostel Facilities</h1>
      </div>

      <div className="flex flex-col gap-4">
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
    </div>
  );
}
