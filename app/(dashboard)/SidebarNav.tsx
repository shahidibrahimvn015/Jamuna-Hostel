"use client";

import { LayoutDashboard, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { DASHBOARD_SECTIONS } from "@/lib/constants/sections";

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
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
  );
}
