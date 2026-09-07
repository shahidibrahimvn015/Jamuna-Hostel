import Image from "next/image";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "./MobileNav";
import { SidebarNav } from "./SidebarNav";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/login");
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Full-height left rail on desktop — runs top to bottom, independent
          of the header (which only spans the content column beside it). */}
      <nav className="bg-sidebar-pattern hidden w-64 shrink-0 p-5 md:block">
        <SidebarNav isAdmin={profile?.role === "admin"} onSignOut={signOut} />
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-hero-pattern grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 text-white">
          <div className="flex items-center gap-2 justify-self-start">
            <MobileNav isAdmin={profile?.role === "admin"} onSignOut={signOut} />
            <div className="hidden md:block">
              <ThemeToggle className="text-white/90" />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 justify-self-center sm:gap-2.5">
            <span className="bg-background flex shrink-0 items-center justify-center rounded-md p-1 ring-1 ring-white/40 sm:p-1.5">
              <Image src="/icon.png" alt="" width={28} height={28} className="size-6 rounded-sm sm:size-7" />
            </span>
            <div className="flex min-w-0 flex-col items-center">
              <span className="text-[0.6rem] font-medium tracking-widest text-white/75 uppercase sm:text-[0.65rem]">
                IIT Madras
              </span>
              <span className="font-heading text-base leading-tight font-semibold tracking-wide text-white uppercase sm:text-lg">
                {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-self-end">
            <div className="hidden text-right text-xs text-white/80 sm:block">
              <div>{profile?.email}</div>
              {profile?.role && (
                <Badge
                  variant="outline"
                  className="mt-0.5 border-white/30 text-white capitalize"
                >
                  {profile.role}
                </Badge>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
