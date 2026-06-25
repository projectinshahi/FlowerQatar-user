import { err, okList, withHandler } from "@/lib/api/handler";
import { NextResponse } from "next/server";
import { CartRepository } from "@/lib/db/repositories/user/cart.user.repository";

export const GET = withHandler(
  async ({ user }): Promise<NextResponse> => {
    // The handler guarantees a user for "access: 'user'", but we defensively check.
    if (!user?.id) {
      // Return a 401 Unauthorized JSON response.
      return err('Authentication required', 401);
    }
    const cartItems = await CartRepository.getAll(user.id);
    const response = okList(cartItems);
    response.headers.set(
      "Cache-Control",
      "private, max-age=300, s-maxage=600"
    );
    return response;
  },
  { access: "user" }
);