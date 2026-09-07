import { ArrowRight, Bell, Siren, User, Wifi } from "lucide-react";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { DASHBOARD_SECTIONS, SECTION_COLOR_CLASSES } from "@/lib/constants/sections";
import { createClient } from "@/lib/supabase/server";
import { PantryPreview } from "./PantryPreview";

export default async function DashboardOverviewPage() {
  const { profile } = await getSessionProfile();
  const supabase = await createClient();

  const [{ data: notices }, { data: rooms }] = await Promise.all([
    supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("pantry_room").select("*").order("id"),
  ]);

  const displayName = profile?.full_name || profile?.roll_number || "there";
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="bg-hero-pattern -mx-4 -mt-4 rounded-b-3xl px-5 pt-6 pb-10 text-white sm:px-6 md:-mx-6 md:-mt-6 md:px-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-widest text-white/75 uppercase">
            {today}
          </p>
          {/* Reserved for a user photo; falls back to the role since no
              photo upload exists yet. */}
          {profile?.role ? (
            <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-white/20 px-3 text-xs font-medium tracking-wide text-white capitalize ring-1 ring-white/30">
              {profile.role}
            </span>
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
              <User className="size-5 text-white" />
            </span>
          )}
        </div>
        <p className="mt-5 text-sm text-white/80">Hello,</p>
        <h1 className="font-heading text-3xl font-semibold">{displayName}</h1>
      </section>

      {/* Quick actions — overlapping the hero, like the two shortcut tiles on the reference design */}
      <div className="-mt-8 grid grid-cols-2 gap-3 px-1 sm:-mt-9 md:-mt-10">
        <Link
          href="/wifi"
          className="bg-brand-gradient flex flex-col justify-between gap-6 rounded-2xl p-4 text-white shadow-md transition-transform hover:-translate-y-0.5"
        >
          <Wifi className="size-6" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Raise WiFi Complaint</span>
            <ArrowRight className="size-4 shrink-0" />
          </div>
        </Link>
        <Link
          href="/emergency"
          className="bg-brand-gradient flex flex-col justify-between gap-6 rounded-2xl p-4 text-white shadow-md transition-transform hover:-translate-y-0.5"
        >
          <Siren className="size-6" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Emergency Contacts</span>
            <ArrowRight className="size-4 shrink-0" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest notifications — the Notice Board's former sidebar slot */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-widest uppercase">
              Latest Notifications
            </h2>
            <Link
              href="/notice-board"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              See all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {(notices ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No notices posted yet.
              </p>
            )}
            {(notices ?? []).map((notice) => (
              <Link
                key={notice.id}
                href="/notice-board"
                className="bg-surface-2 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors hover:bg-accent"
              >
                <span className="bg-notice/12 flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Bell className="text-notice size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{notice.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notice.event_date).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pantry status — the "today's classes" slot */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-widest uppercase">
            Pantry Status
          </h2>
          <PantryPreview rooms={rooms ?? []} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_SECTIONS.map((section, i) => {
          const colors = SECTION_COLOR_CLASSES[section.color];
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group flex">
              <div
                className={`bg-card flex-1 gap-4 rounded-xl border border-t-4 px-5 py-6 transition-all ${colors.border} hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-10 items-center justify-center rounded-full ${colors.chip}`}
                  >
                    <Icon className={`size-5 ${colors.text}`} />
                  </span>
                  <span className="text-xs font-medium tracking-widest text-muted-foreground/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="font-heading text-lg group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                    {section.title}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
