import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateUserPassword } from "@/lib/db/repositories/user/account.user.repository";
import { hashPassword } from "@/lib/utils/password";

/**
 * POST /api/auth/set-password
 * Expects JSON body: { password: string, confirmPassword: string }
 * Requires the user to be authenticated via a session (e.g., after Google OAuth).
 * If the session indicates `requiresPasswordSetup`, the password is hashed and stored.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!(session.user as any).requiresPasswordSetup) {
    return NextResponse.json({ error: "Password already set" }, { status: 400 });
  }

  const { password, confirmPassword } = await req.json();
  if (!password || !confirmPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  // Basic validation can be added here (length, strength, etc.)
  const passwordHash = await hashPassword(password);
  await updateUserPassword(session.user.id as string, passwordHash);

  // Optionally, you could refresh the session here to clear the flag.
  return NextResponse.json({ message: "Password set successfully" }, { status: 200 });
}

/**
 * Optional GET to check if password setup is required.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ requiresPasswordSetup: false }, { status: 401 });
  }
  return NextResponse.json({ requiresPasswordSetup: !!(session.user as any).requiresPasswordSetup }, { status: 200 });
}
