"use client";

import {
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { Role } from "@/lib/auth/roles";
import {
  COMPLAINTS_SHEET_URL,
  DASHBOARD_SECTIONS,
} from "@/lib/constants/sections";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Leaves the app: rendered as a plain anchor opening in a new tab, and never
  // highlighted as the active route.
  external?: boolean;
};

const linkClass =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors";

export function SidebarNav({
  role,
  onSignOut,
}: {
  role: Role | null | undefined;
  onSignOut: () => void | Promise<void>;
}) {
  const pathname = usePathname();

  const isAdmin = role === "admin";
  // The complaints register is for people who actually live here. Hiding the
  // link is presentation only -- who can open the sheet is decided by its
  // Google Drive sharing settings, not by this app.
  const canSeeComplaints = isAdmin || role === "resident";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...DASHBOARD_SECTIONS.map((section) => ({
      href: section.href,
      label: section.title,
      icon: section.icon,
    })),
    ...(canSeeComplaints
      ? [
          {
            href: COMPLAINTS_SHEET_URL,
            label: "Complaints",
            icon: MessageSquareWarning,
            external: true,
          },
        ]
      : []),
    ...(isAdmin
      ? [{ href: "/admin/residents", label: "Manage Residents", icon: UserCog }]
      : []),
  ];

  return (
    <div className="flex h-full flex-col gap-6 text-white">
      <p className="font-heading text-2xl font-semibold">Menu</p>

      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = !item.external && pathname === item.href;
          const Icon = item.icon;

          const inner = (
            <>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.external ? (
                <ExternalLink className="size-4 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="size-4 shrink-0 opacity-70" />
              )}
            </>
          );

          const className = cn(
            linkClass,
            isActive
              ? "bg-white/15 font-medium text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          );

          return (
            <li key={item.href}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {inner}
                </a>
              ) : (
                <Link href={item.href} className={className}>
                  {inner}
                </Link>
              )}
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
