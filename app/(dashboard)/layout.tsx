import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
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
      <header className="relative flex items-center justify-end border-b bg-card px-4 py-3">
        <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
          <span className="text-[0.65rem] font-medium tracking-widest text-muted-foreground uppercase">
            IIT Madras
          </span>
          <span className="font-heading text-lg leading-tight font-semibold tracking-wide uppercase">
            {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
          </span>
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
        <nav className="hidden w-60 shrink-0 flex-col border-r bg-card p-4 md:flex">
          <div className="flex-1">
            <SidebarNav isAdmin={profile?.role === "admin"} />
          </div>
          <div className="border-t pt-3">
            <ThemeToggle />
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
