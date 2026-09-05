import {
  Bell,
  Siren,
  UtensilsCrossed,
  Users,
  Wallet,
  Wifi,
  type LucideIcon,
} from "lucide-react";

export type DashboardSection = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "notice" | "pantry" | "wifi" | "hostelrep" | "budget" | "emergency";
};

export const SECTION_COLOR_CLASSES: Record<
  DashboardSection["color"],
  { text: string; border: string; chip: string }
> = {
  notice: { text: "text-notice", border: "border-t-notice", chip: "bg-notice/12" },
  pantry: { text: "text-pantry", border: "border-t-pantry", chip: "bg-pantry/12" },
  wifi: { text: "text-wifi", border: "border-t-wifi", chip: "bg-wifi/12" },
  hostelrep: {
    text: "text-hostelrep",
    border: "border-t-hostelrep",
    chip: "bg-hostelrep/12",
  },
  budget: { text: "text-budget", border: "border-t-budget", chip: "bg-budget/12" },
  emergency: {
    text: "text-emergency",
    border: "border-t-emergency",
    chip: "bg-emergency/12",
  },
};

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    href: "/notice-board",
    title: "Notice Board",
    description: "Upcoming events and announcements.",
    icon: Bell,
    color: "notice",
  },
  {
    href: "/pantry-room",
    title: "Pantry Room",
    description: "Check live occupancy and set your usage timer.",
    icon: UtensilsCrossed,
    color: "pantry",
  },
  {
    href: "/wifi",
    title: "WiFi / LAN",
    description: "Official network pages, troubleshooting tips and complaints.",
    icon: Wifi,
    color: "wifi",
  },
  {
    href: "/hostel-rep",
    title: "Hostel Representatives",
    description: "Hostel office (including the warden) and council details.",
    icon: Users,
    color: "hostelrep",
  },
  {
    href: "/budget",
    title: "Budget",
    description: "Semester budget and per-secretary spending.",
    icon: Wallet,
    color: "budget",
  },
  {
    href: "/emergency",
    title: "Emergency",
    description: "First-aid kit contents and emergency contacts.",
    icon: Siren,
    color: "emergency",
  },
];
