import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";
import { DASHBOARD_SECTIONS, SECTION_COLOR_CLASSES } from "@/lib/constants/sections";

export default async function DashboardOverviewPage() {
  const { profile } = await getSessionProfile();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Roll no. {profile?.roll_number} · {profile?.role}
        </p>
        <h1 className="font-heading text-3xl font-medium">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_SECTIONS.map((section, i) => {
          const colors = SECTION_COLOR_CLASSES[section.color];
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group flex">
              <Card
                className={`flex-1 gap-4 border-t-4 px-1 py-6 transition-all ${colors.border} hover:-translate-y-0.5 hover:shadow-md`}
              >
                <CardHeader className="gap-3">
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
                  <div className="flex flex-col gap-1.5">
                    <CardTitle className="text-lg group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {section.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
