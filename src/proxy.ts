import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

// Role gate for /admin/* — see ARCHITECTURE.md#routing-map. Admin Server
// Actions must still re-check role themselves (see PROJECT_RULES.md); this
// proxy is the first line of defense, not the only one.
export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
