import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRollNumber } from "@/lib/auth/extractRollNumber";
import { upsertProfileWithResolvedRole } from "@/lib/auth/resolveRole";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  const rollNumber = extractRollNumber(data.user.email);

  if (!rollNumber) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  await upsertProfileWithResolvedRole({
    id: data.user.id,
    email: data.user.email,
    rollNumber,
  });

  return NextResponse.redirect(`${origin}/dashboard`);
}
