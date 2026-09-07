"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function LoginError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (error !== "domain") return null;

  return (
    <p className="text-center text-sm text-destructive">
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
        queryParams: { hd: "smail.iitm.ac.in" },
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border/70 shadow-lg">
        <div className="bg-hero-pattern flex flex-col items-center gap-1 px-8 pt-10 pb-16 text-center text-white">
          <Image
            src="/icon.png"
            alt=""
            width={56}
            height={56}
            className="rounded-xl ring-1 ring-white/40"
          />
          <span className="mt-3 text-[0.65rem] font-medium tracking-widest text-white/75 uppercase">
            IIT Madras
          </span>
          <p className="font-heading text-lg font-semibold tracking-wide uppercase">
            {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
          </p>

          <h1 className="font-heading mt-6 text-2xl font-semibold">Welcome</h1>
          <p className="text-sm text-white/80">Sign in to continue</p>
        </div>

        <div className="relative -mt-6 flex flex-col items-center gap-4 rounded-t-3xl bg-card px-8 py-8">
          <Suspense fallback={null}>
            <LoginError />
          </Suspense>

          <Button onClick={signInWithGoogle} size="lg" className="w-full">
            Sign in with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Only @smail.iitm.ac.in accounts are allowed
          </p>
        </div>
      </div>
    </div>
  );
}
