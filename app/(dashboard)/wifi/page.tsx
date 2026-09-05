import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { ComplaintForm } from "./ComplaintForm";
import { OfficialLinks } from "./OfficialLinks";
import { TicketsTable } from "./TicketsTable";
import { TroubleshootingTips } from "./TroubleshootingTips";

export default async function WifiPage() {
  const { user, profile } = await getSessionProfile();
  const supabase = await createClient();

  const [{ data: blocks }, { data: tips }, { data: myTickets }] = await Promise.all([
    supabase.from("wifi_troubleshooting_blocks").select("*").order("sort_order"),
    supabase.from("wifi_troubleshooting_tips").select("*").order("sort_order"),
    supabase
      .from("wifi_tickets")
      .select("*")
      .eq("raised_by", user?.id ?? "")
      .order("created_at", { ascending: false }),
  ]);

  const isAdmin = profile?.role === "admin";

  let adminTickets: typeof myTickets = null;
  if (isAdmin) {
    const { data } = await supabase
      .from("wifi_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    adminTickets = data;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">WiFi / LAN</h1>
        <p className="text-sm text-muted-foreground">
          Official network setup pages, troubleshooting tips and complaints.
        </p>
      </div>

      <OfficialLinks />

      <TroubleshootingTips blocks={blocks ?? []} tips={tips ?? []} isAdmin={isAdmin} />

      <ComplaintForm smailId={user?.email ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>My raised tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsTable
            tickets={myTickets ?? []}
            currentUserId={user?.id ?? ""}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>All tickets (admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketsTable
              tickets={adminTickets ?? []}
              currentUserId={user?.id ?? ""}
              isAdmin={isAdmin}
              showResolveAction
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
