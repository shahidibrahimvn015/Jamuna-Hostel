import { ExternalLink } from "lucide-react";
import { OFFICIAL_NETWORK_LINKS } from "@/lib/constants/network";

export function OfficialLinks() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        Official IITM Network Pages
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OFFICIAL_NETWORK_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-gradient flex items-center justify-between gap-3 rounded-2xl p-4 text-white shadow-md transition-transform hover:-translate-y-0.5"
          >
            <span className="text-sm font-medium">{link.label}</span>
            <ExternalLink className="size-4 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
