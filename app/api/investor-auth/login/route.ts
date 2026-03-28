export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import {
  INVESTOR_SESSION_COOKIE
} from "@/lib/turicum/investor-auth";
import {
  createSupabaseInvestorRouteClient,
  getInvestorProfileByUserId,
  isSupabaseInvestorAuthConfigured
} from "@/lib/turicum/investor-supabase-auth";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const normalizedEmail = email.trim().toLowerCase();
  const supabaseConfigured = isSupabaseInvestorAuthConfigured();

  if (!supabaseConfigured) {
    return NextResponse.redirect(buildAppUrl(request, "/investors?error=unavailable"), {
      status: 303
    });
  }

  try {
    const response = NextResponse.redirect(buildAppUrl(request, "/investors"), {
      status: 303
    });
    const supabase = createSupabaseInvestorRouteClient(request, response);

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (!error && data.user) {
        const profile = await getInvestorProfileByUserId(data.user.id, data.user.email);

        if (profile?.isActive) {
          response.cookies.set({
            name: INVESTOR_SESSION_COOKIE,
            value: "",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            expires: new Date(0),
            path: "/"
          });
          return response;
        }

        await supabase.auth.signOut();
      }
    }
  } catch (error) {
    console.error("Turicum Supabase investor sign-in failed", error);
  }

  return NextResponse.redirect(buildAppUrl(request, "/investors?error=invalid"), {
    status: 303
  });
}
