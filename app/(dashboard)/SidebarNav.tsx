"use client";

import { ChevronRight, LayoutDashboard, LogOut, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
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
    ...(isAdmin
      ? [{ href: "/admin/residents", label: "Manage Residents", icon: UserCog }]
      : []),
  ];

  return (
    <div className="flex h-full flex-col gap-6 text-white">
      <p className="font-heading text-2xl font-semibold">Menu</p>

      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="size-4 shrink-0 opacity-70" />
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={onSignOut} className="mt-auto border-t border-white/20 pt-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="flex-1 text-left">Log Out</span>
          <ChevronRight className="size-4 shrink-0 opacity-70" />
        </button>
      </form>
    </div>
  );
}
