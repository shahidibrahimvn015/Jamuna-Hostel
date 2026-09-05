import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { RepSectionCard } from "./RepSectionCard";

export default async function HostelRepPage() {
  const { profile } = await getSessionProfile();
  const supabase = await createClient();

  const { data: reps } = await supabase
    .from("hostel_reps")
    .select("*")
    .order("sort_order")
    .order("name");

  const isAdmin = profile?.role === "admin";
  const all = reps ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Hostel Representatives</h1>
        <p className="text-sm text-muted-foreground">
          Hostel council and office details.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <RepSectionCard
          section="council"
          title="Hostel Council (Active)"
          reps={all.filter((r) => r.section === "council")}
          isAdmin={isAdmin}
          layout="grid"
        />
        <RepSectionCard
          section="office"
          title="Hostel Office"
          reps={all.filter((r) => r.section === "office")}
          isAdmin={isAdmin}
          layout="list"
        />
      </div>
    </div>
  );
}
