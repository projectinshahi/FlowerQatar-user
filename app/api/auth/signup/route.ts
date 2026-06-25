import { apiResponse } from "@/lib/api/response";
import { createUser, getUserByEmail } from "@/lib/db/repositories/public/user.public.repository";
import { validateEmail, validatePassword, ValidationError } from "@/lib/validation";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export const POST = async (req: Request) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = await req.json();

    // 1. Validate input
    if (!email || !password || !firstName || !lastName) {
      return apiResponse({ error: "Missing required fields" }, 400);
    }

    const cleanEmail = validateEmail(email);
    const cleanPassword = validatePassword(password);

    if (confirmPassword && cleanPassword !== confirmPassword) {
      return apiResponse({ error: "Passwords do not match" }, 400);
    }

    // 2. Check existing user
    const existing = await getUserByEmail(cleanEmail);
    
    if (existing.length) {
      return apiResponse({ error: "User already exists" }, 400);
    }

    // 3. Hash password (ONLY here)
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // 4. Create user
    const user = await createUser({
      first_name: String(firstName).trim(),
      last_name: String(lastName).trim(),
      email: cleanEmail,
      password: hashedPassword, // already hashed
    });

    // 5. Return success
    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof ValidationError) {
      return apiResponse({ error: error.message }, error.status);
    }

    return apiResponse(
      { error: "Internal server error" },
      500
    );
  }
};

// export const POST = withHandler(
//   (async())
// )
