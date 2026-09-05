import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { EmergencyContactsCard } from "./EmergencyContactsCard";
import { FirstAidCard } from "./FirstAidCard";

export default async function EmergencyPage() {
  const { profile } = await getSessionProfile();
  const supabase = await createClient();

  const [{ data: info }, { data: contacts }] = await Promise.all([
    supabase.from("first_aid_info").select("*").eq("id", 1).maybeSingle(),
    supabase.from("emergency_contacts").select("*").order("sort_order"),
  ]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Emergency</h1>
        <p className="text-sm text-muted-foreground">
          First-aid kit contents, usage guidelines and emergency contacts.
        </p>
      </div>

      <FirstAidCard info={info ?? null} isAdmin={isAdmin} />
      <EmergencyContactsCard contacts={contacts ?? []} isAdmin={isAdmin} />
    </div>
  );
}
