export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import {
  invalidateInvestorSession,
  INVESTOR_SESSION_COOKIE
} from "@/lib/turicum/investor-auth";
import {
  createSupabaseInvestorRouteClient,
  isSupabaseInvestorAuthConfigured
} from "@/lib/turicum/investor-supabase-auth";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${INVESTOR_SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (token) {
    await invalidateInvestorSession(token);
  }

  const response = NextResponse.redirect(buildAppUrl(request, "/investors?logged_out=1"), {
    status: 303
  });

  if (isSupabaseInvestorAuthConfigured()) {
    try {
      const supabase = createSupabaseInvestorRouteClient(request, response);
      await supabase?.auth.signOut();
    } catch (error) {
      console.error("Turicum Supabase investor sign-out failed", error);
    }
  }

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
