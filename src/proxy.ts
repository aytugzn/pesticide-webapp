import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
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
    const decodedClaims = await getAdminAuth().verifySessionCookie(session, true);
    
    const allowedEmail = process.env.ADMIN_EMAIL || "";
    if (decodedClaims.email !== allowedEmail) {
      console.warn("Unauthorized admin email access attempt rejected.");
      const response = NextResponse.redirect(new URL(ROUTES.login, request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    return NextResponse.next();

  } catch {
    console.error("Failed to verify admin token. Redirecting to login.");
    const response = NextResponse.redirect(new URL(ROUTES.login, request.url));

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  }
};


export const config = {
  matcher: ['/admin/:path*'],
};

export default proxy;