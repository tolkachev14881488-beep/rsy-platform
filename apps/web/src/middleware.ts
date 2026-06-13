import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLayoutVariantFromCookie } from "@rsy/rsy";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get("rsy_layout")) {
    const variant = getLayoutVariantFromCookie();
    response.cookies.set("rsy_layout", variant, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
