import Image from "next/image";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <header className="relative flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <MobileNav isAdmin={profile?.role === "admin"} />
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
          <Image
            src="/icon.png"
            alt=""
            width={36}
            height={36}
            className="rounded-md ring-1 ring-border/60"
          />
          <div className="flex flex-col items-start">
            <span className="text-[0.65rem] font-medium tracking-widest text-muted-foreground uppercase">
              IIT Madras
            </span>
            <span className="font-heading text-lg leading-tight font-semibold tracking-wide uppercase">
              {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <div>{profile?.email}</div>
            {profile?.role && (
              <Badge variant="outline" className="mt-0.5 capitalize">
                {profile.role}
              </Badge>
            )}
          </div>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-60 shrink-0 border-r bg-card p-4 md:block">
          <SidebarNav isAdmin={profile?.role === "admin"} />
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
