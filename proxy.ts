import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { ROUTES, SESSION_COOKIE_NAME } from "@/constants/routes";

const ADMIN_ROUTES = ROUTES.admin;

const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_ROUTES)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  try {
    await adminAuth.verifySessionCookie(session, true);
    return NextResponse.next();
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    const response = NextResponse.redirect(new URL(ROUTES.login, request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
};

export const config = {
  matcher: ["/admin/:path*"],
};

export { proxy };
