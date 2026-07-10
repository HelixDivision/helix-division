import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

// Role/session gates — see ARCHITECTURE.md#routing-map. Admin/account Server
// Actions must still re-check role/session themselves (see PROJECT_RULES.md);
// this proxy is the first line of defense, not the only one.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      // Not signed in — send to login and remember where they were headed, so
      // an admin who opens /admin directly is returned to /admin (the Dashboard)
      // after authenticating, not to the customer /account default.
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (req.auth.user?.role !== "ADMIN") {
      // Signed in but not an admin — send home, never back to /login (that would
      // loop: they'd re-authenticate and immediately fail this same check).
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
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
