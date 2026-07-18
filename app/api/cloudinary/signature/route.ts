import { ok, withUser } from "@/lib/api";
import { signUpload } from "@/lib/cloudinary";

// GET /api/cloudinary/signature — signed params for a logged-in user to upload a
// profile image directly to Cloudinary (folder must match on the client upload).
export const GET = withUser(async () => {
  return ok(signUpload("flower_users"));
});
