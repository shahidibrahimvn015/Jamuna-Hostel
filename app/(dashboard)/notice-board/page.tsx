import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { NoticeBoardClient, type NoticeItem } from "./NoticeBoardClient";

export default async function NoticeBoardPage() {
  const { profile } = await getSessionProfile();
  const supabase = await createClient();

  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .order("event_date", { ascending: false });

  const items: NoticeItem[] = (notices ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    event_date: n.event_date,
    posterUrl: n.poster_path
      ? supabase.storage.from("notice-posters").getPublicUrl(n.poster_path)
          .data.publicUrl
      : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Notice Board</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming events and announcements.
        </p>
      </div>

      <NoticeBoardClient notices={items} isAdmin={profile?.role === "admin"} />
    </div>
  );
}
