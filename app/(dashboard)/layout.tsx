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
    <div className="flex min-h-screen flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2 justify-self-start">
          <MobileNav isAdmin={profile?.role === "admin"} onSignOut={signOut} />
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 justify-self-center sm:gap-2.5">
          <Image
            src="/icon.png"
            alt=""
            width={36}
            height={36}
            className="size-8 shrink-0 rounded-md ring-1 ring-border/60 sm:size-9"
          />
          <div className="flex min-w-0 flex-col items-center">
            <span className="text-[0.6rem] font-medium tracking-widest text-muted-foreground uppercase sm:text-[0.65rem]">
              IIT Madras
            </span>
            <span className="font-heading text-base leading-tight font-semibold tracking-wide uppercase sm:text-lg">
              {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-self-end">
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <div>{profile?.email}</div>
            {profile?.role && (
              <Badge variant="outline" className="mt-0.5 capitalize">
                {profile.role}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-60 shrink-0 border-r bg-card p-4 md:block">
          <SidebarNav isAdmin={profile?.role === "admin"} onSignOut={signOut} />
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
