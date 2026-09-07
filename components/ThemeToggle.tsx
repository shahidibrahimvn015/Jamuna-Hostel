"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "cn";
import { Switch } from "@/components/ui/switch";

const emptySubscribe = () => () => {};

// Reports `false` during SSR and the initial client hydration pass (matching
// the server output exactly, so no hydration mismatch), then flips to `true`
// right after — the React-documented replacement for the old
// useState+useEffect "mounted" trick.
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <label
      className={cn(
        "flex w-fit cursor-pointer items-center gap-2",
        className ?? "text-muted-foreground"
      )}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
    </label>
  );
}
