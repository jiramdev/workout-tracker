// middleware.ts
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", req.nextUrl.pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match alle request paths behalve:
     * - api (API routes)
     * - login & register (auth pagina's)
     * - _next/static (statische bestanden)
     * - _next/image (image optimalisatie)
     * - favicon.ico, manifest.webmanifest, iconen
     */
    "/((?!api|login|register|_next/static|_next/image|favicon.ico|sw\\.js|manifest.webmanifest|icons|.*\\.png$).*)",
  ],
};