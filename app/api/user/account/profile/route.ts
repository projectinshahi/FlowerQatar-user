import { ok, withHandler } from "@/lib/api/handler";
import { getUserProfile, updateAccountProfile } from "@/lib/db/repositories/user/account.user.repository";
import { NextResponse } from "next/server";

export const GET = withHandler(
    async ({ user }) => {
        const userId = user?.id;
        if (!userId) {
            throw new Error("Unauthorized");
        }
        const profile = await getUserProfile(userId);
        if (!profile) {
            throw new Error("Profile not found");
        }
        const response = ok({ data: profile });
        response.headers.set("Cache-Control", "no-store");
        return response;
    },
    { access: "user" }
);



// export const PATCH = withHandler(
//     async ({ req, user }): Promise<NextResponse> => {
//         try {
//             const body = await req.json();
//             console.log('PATCH profile payload:', body);

//             const userId = user.id;

//             if (!userId) {
//                 throw new Error("Unauthorized");
//             }

//             const updatedProfile =
//                 await updateAccountProfile(
//                     userId,
//                     body
//                 );
//             console.log('Updated profile result:', updatedProfile);

//             if (!updatedProfile) {
//                 throw new Error(
//                     "Failed to update profile"
//                 );
//             }

//             const response = ok({
//                 message: "Profile updated successfully",
//                 data: updatedProfile,
//             });

//             response.headers.set(
//                 "Cache-Control",
//                 "no-store"
//             );

//             return response;
//         } catch (error) {
//             console.error(
//                 "PATCH profile error:",
//                 error
//             );

//             throw error;
//         }
//     },
//     { access: "user" }
// );

export const PATCH = withHandler(
  async ({ req, user }) => {
    try {
      console.log("========== PATCH START ==========");

      const body = await req.json();

      console.log("BODY:", body);
      console.log("USER:", user);

      const userId = user?.id;

      if (!userId) {
        throw new Error("Unauthorized");
      }

      console.log("USER ID:", userId);

      const updatedProfile = await updateAccountProfile(
        userId,
        body
      );

      console.log(
        "UPDATED PROFILE:",
        updatedProfile
      );

      return ok({
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error(
        "PATCH PROFILE ERROR:",
        error
      );

      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        {
          status: 500,
        }
      );
    }
  },
  { access: "user" }
);