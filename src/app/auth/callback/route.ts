import { NextResponse, type NextRequest } from "next/server";
import { fetchProfile, isProfileComplete } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Google sends the user back to Supabase, and Supabase sends them here with
// ?code=... (PKCE authorization code). This handler swaps the code for a
// session, writes the auth cookies, and decides where the user goes next.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  // Behind Vercel's proxy, request.url carries the internal host, so prefer
  // the forwarded host for the redirect back to the app.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const baseUrl =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  if (!code) {
    const message = providerError ?? "Missing authorization code.";
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(message)}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const message = error?.message ?? "Could not complete sign-in.";
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(message)}`,
    );
  }

  // The auth.users trigger has already created the profiles row by now.
  // New users (no names yet) go to onboarding; returning users go to the
  // members area.
  const profile = await fetchProfile(supabase, data.user.id);
  const destination = isProfileComplete(profile) ? "/dashboard" : "/onboarding";

  return NextResponse.redirect(`${baseUrl}${destination}`);
}
