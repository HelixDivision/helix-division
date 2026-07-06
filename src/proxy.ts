import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

// Role/session gates — see ARCHITECTURE.md#routing-map. Admin/account Server
// Actions must still re-check role/session themselves (see PROJECT_RULES.md);
// this proxy is the first line of defense, not the only one.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (pathname.startsWith("/account") && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
