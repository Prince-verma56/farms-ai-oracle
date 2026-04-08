import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const unAwaitedClerkClient = await clerkClient();
    const user = await unAwaitedClerkClient.users.getUser(userId);
    const clerkRole = user.publicMetadata?.role as string | undefined;

    let convexRole: "farmer" | "buyer" | null = null;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      const convex = new ConvexHttpClient(convexUrl);
      const convexUser = await convex.query(api.users.getRoleByClerkId, {
        clerkId: userId,
      });
      convexRole = convexUser?.role ?? null;
    }

    const normalizedClerkRole =
      clerkRole === "farmer" || clerkRole === "buyer" ? clerkRole : null;
    const role = normalizedClerkRole ?? convexRole;

    return NextResponse.json({ exists: !!role, role: role || null });
  } catch (error) {
    console.error("[GET /api/me/role]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !["farmer", "buyer"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    const unAwaitedClerkClient = await clerkClient();
    const user = await unAwaitedClerkClient.users.getUser(userId);

    await unAwaitedClerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
      },
    });

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      const convex = new ConvexHttpClient(convexUrl);
      await convex.mutation(api.users.upsertRoleByClerkId, {
        clerkId: user.id,
        role,
        name: user.fullName || user.firstName || "User",
        email:
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          "unknown@example.com",
        imageUrl: user.imageUrl || undefined,
      });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("[POST /api/me/role]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
