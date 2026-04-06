import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ role: null, exists: false }, { status: 401 });

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return NextResponse.json({ role: null, exists: false }, { status: 500 });

  const convex = new ConvexHttpClient(convexUrl);
  const result = await convex.query(api.users.getRoleByClerkId, { clerkId: userId });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { role?: "farmer" | "buyer" };
  if (body.role !== "farmer" && body.role !== "buyer") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return NextResponse.json({ error: "Missing Convex URL." }, { status: 500 });

  const clerkUser = await currentUser();
  const convex = new ConvexHttpClient(convexUrl);
  await convex.mutation(api.users.upsertRoleByClerkId, {
    clerkId: userId,
    role: body.role,
    name: clerkUser?.fullName || clerkUser?.firstName || "Anonymous",
    email: clerkUser?.emailAddresses?.[0]?.emailAddress || "unknown@example.com",
    imageUrl: clerkUser?.imageUrl,
  });

  return NextResponse.json({ role: body.role, ok: true });
}
