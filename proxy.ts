import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set<string>(["/", "/sign-in", "/sign-up"]);
const ROLE_NEUTRAL_ROUTES = ["/hub", "/onboarding", "/role-redirect"];

function getRoleFromClaims(sessionClaims: unknown): "farmer" | "buyer" | null {
  if (!sessionClaims || typeof sessionClaims !== "object") return null;

  const claims = sessionClaims as Record<string, unknown>;
  const directRole = claims.role;
  if (directRole === "farmer" || directRole === "buyer") return directRole;

  const metadata = claims.metadata;
  if (metadata && typeof metadata === "object") {
    const role = (metadata as Record<string, unknown>).role;
    if (role === "farmer" || role === "buyer") return role;
  }

  const publicMetadata = claims.public_metadata;
  if (publicMetadata && typeof publicMetadata === "object") {
    const role = (publicMetadata as Record<string, unknown>).role;
    if (role === "farmer" || role === "buyer") return role;
  }

  return null;
}

function isRoleNeutralRoute(pathname: string) {
  return ROLE_NEUTRAL_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith("/api/");
  const isPublic = PUBLIC_ROUTES.has(pathname);

  if (!userId) {
    if (isPublic || pathname.startsWith("/api/")) return NextResponse.next();
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const role = getRoleFromClaims(sessionClaims);

  if (!role && pathname === "/onboarding") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/farmer") || pathname.startsWith("/admin")) {
    if (role && role !== "farmer") {
      return NextResponse.redirect(new URL("/marketplace", req.url));
    }
  }

  if (pathname.startsWith("/buyer") || pathname.startsWith("/marketplace")) {
    if (role && role !== "buyer") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  if (pathname === "/onboarding" && role) {
    return NextResponse.redirect(new URL("/hub", req.url));
  }

  if (pathname === "/role-redirect" && role) {
    return NextResponse.redirect(new URL("/hub", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
