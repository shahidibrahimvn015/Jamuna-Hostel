import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { AddResidentForm } from "./AddResidentForm";
import { BulkImportDialog } from "./BulkImportDialog";
import { ResidentsTable } from "./ResidentsTable";

export default async function ResidentsAdminPage() {
  const { profile } = await getSessionProfile();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: residents } = await supabase
    .from("residents")
    .select("*")
    .order("roll_number");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Manage Residents</h1>
          <p className="text-sm text-muted-foreground">
            Roll numbers on this list get resident privileges (pantry room
            usage, raising complaints).
          </p>
        </div>
        <BulkImportDialog />
      </div>

      <AddResidentForm />

      <ResidentsTable residents={residents ?? []} />
    </div>
  );
}
