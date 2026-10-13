import { NextResponse, type NextRequest } from "next/server";

import { createServerAuthClient } from "@/lib/admin/supabase-auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();

  const adminHost = (process.env.ADMIN_HOST ?? "").toLowerCase();
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const loginPath = host === adminHost ? "/login" : "/admin/login";
  return NextResponse.redirect(new URL(loginPath, request.url), { status: 303 });
}
