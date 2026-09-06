"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
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

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-muted-foreground">
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
