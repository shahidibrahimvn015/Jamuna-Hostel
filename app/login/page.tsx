"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function LoginError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (error !== "domain") return null;

  return (
    <p className="text-sm text-destructive text-center">
      Please sign in with your @smail.iitm.ac.in account.
    </p>
  );
}

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: { hd: "smail.iitm.ac.in", prompt: "select_account" },
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 border border-border/70 bg-card px-8 py-10 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[0.65rem] font-medium tracking-widest text-muted-foreground uppercase">
            IIT Madras
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-wide uppercase">
            {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
          </h1>
          <span className="h-px w-10 bg-primary" />
          <p className="pt-1 text-sm text-muted-foreground">
            Sign in with your @smail.iitm.ac.in Google account
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        <Button onClick={signInWithGoogle} size="lg" className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
