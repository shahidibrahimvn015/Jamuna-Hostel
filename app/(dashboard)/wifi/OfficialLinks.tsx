import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OFFICIAL_NETWORK_LINKS } from "@/lib/constants/network";

export function OfficialLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Official IITM Network Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {OFFICIAL_NETWORK_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
