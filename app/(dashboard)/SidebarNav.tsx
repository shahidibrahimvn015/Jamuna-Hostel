"use client";

import { LayoutDashboard, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { DASHBOARD_SECTIONS } from "@/lib/constants/sections";

export function SidebarNav({
  isAdmin,
  onSignOut,
}: {
  isAdmin: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...DASHBOARD_SECTIONS.map((section) => ({
      href: section.href,
      label: section.title,
      icon: section.icon,
    })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 border-l-2 py-1.5 pr-2 pl-3 text-sm transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
        {isAdmin && (
          <li>
            <Link
              href="/admin/residents"
              className={cn(
                "flex items-center gap-2.5 border-l-2 py-1.5 pr-2 pl-3 text-sm transition-colors",
                pathname === "/admin/residents"
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCog className="size-4 shrink-0" />
              Manage Residents
            </Link>
          </li>
        )}
      </ul>

      <form action={onSignOut} className="border-t pt-3">
        <Button variant="outline" size="sm" type="submit" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
