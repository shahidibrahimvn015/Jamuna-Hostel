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
    <p className="text-center text-sm text-red-100">
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
    <div className="bg-brand-gradient flex min-h-screen flex-col items-center justify-center gap-10 p-6 text-center text-white">
      <div className="flex flex-col items-center gap-1">
        <span className="flex items-center justify-center rounded-xl bg-background p-2 ring-1 ring-white/40">
          <Image src="/icon.png" alt="" width={40} height={40} className="rounded-md" />
        </span>
        <span className="mt-3 text-[0.65rem] font-medium tracking-widest text-white/75 uppercase">
          IIT Madras
        </span>
        <p className="font-heading text-lg font-semibold tracking-wide uppercase">
          {process.env.NEXT_PUBLIC_HOSTEL_NAME ?? "Jamuna Hostel"}
        </p>

        <h1 className="font-heading mt-6 text-2xl font-semibold">Welcome</h1>
        <p className="text-sm text-white/80">Sign in to continue</p>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        <Button
          onClick={signInWithGoogle}
          size="lg"
          className="w-full bg-[#422400] text-white hover:bg-[#422400]/85"
        >
          Sign in with Google
        </Button>

        <p className="text-center text-xs text-white/70">
          Only @smail.iitm.ac.in accounts are allowed
        </p>
      </div>
    </div>
  );
}
