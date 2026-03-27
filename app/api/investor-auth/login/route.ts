export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  authenticateInvestorUser,
  createInvestorSession,
  INVESTOR_SESSION_COOKIE
} from "@/lib/turicum/investor-auth";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await authenticateInvestorUser(email, password);

  if (!user) {
    return NextResponse.redirect(buildAppUrl(request, "/investors?error=invalid"), {
      status: 303
    });
  }

  const session = await createInvestorSession(user.id);
  const response = NextResponse.redirect(buildAppUrl(request, "/investors"), {
    status: 303
  });

  response.cookies.set({
    name: INVESTOR_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expiresAt),
    path: "/"
  });

  return response;
}
