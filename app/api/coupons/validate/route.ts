import { ok, err, withHandler } from "@/lib/api/handler"
import { CouponRepository } from "@/lib/db/repositories/admin/coupon.repository"
import { NextRequest } from "next/server"

// POST /api/coupons/validate
// Body: { coupon_code, order_amount }
export const POST = withHandler(
  async ({ req, user }: { req: NextRequest; user?: any }) => {
    const { coupon_code, order_amount } = await req.json()

    if (!coupon_code?.trim()) return err("Coupon code is required", 400)

    const coupon = await CouponRepository.findByCode(coupon_code.trim())
    if (!coupon) return err("Invalid coupon code", 404)
    if (!coupon.is_active) return err("This coupon is inactive", 400)

    const now = new Date()
    if (new Date(coupon.start_date) > now)
      return err("This coupon is not yet valid", 400)
    if (new Date(coupon.expiry_date) < now)
      return err("This coupon has expired", 400)

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)
      return err("This coupon has reached its usage limit", 400)

    const amount = Number(order_amount ?? 0)
    if (amount < Number(coupon.minimum_order_amount))
      return err(`Minimum order amount is ₹${coupon.minimum_order_amount}`, 400)

    // One-per-user check (only if authenticated)
    if (user?.id) {
      const alreadyUsed = await CouponRepository.hasUserUsed(coupon.id, user.id)
      if (alreadyUsed) return err("You have already used this coupon", 400)
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.coupon_type === "PERCENTAGE") {
      discountAmount = (amount * Number(coupon.discount_value)) / 100
      if (coupon.maximum_discount_amount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maximum_discount_amount))
      }
    } else {
      discountAmount = Number(coupon.discount_value)
    }
    discountAmount = Math.min(discountAmount, amount) // can't discount more than order

    const finalAmount = amount - discountAmount

    return ok({
      valid: true,
      coupon: {
        id: coupon.id,
        title: coupon.title,
        coupon_code: coupon.coupon_code,
        coupon_type: coupon.coupon_type,
        discount_value: coupon.discount_value,
        minimum_order_amount: coupon.minimum_order_amount,
        maximum_discount_amount: coupon.maximum_discount_amount,
      },
      original_amount: amount,
      discount_amount: Math.round(discountAmount * 100) / 100,
      final_amount: Math.round(finalAmount * 100) / 100,
    })
  },
  { access: "public" }
)
