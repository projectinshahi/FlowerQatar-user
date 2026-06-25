import { ok, err, withHandler } from "@/lib/api/handler"
import { CouponRepository, generateUniqueCouponCode } from "@/lib/db/repositories/admin/coupon.repository"
import { NextRequest } from "next/server"

// GET /api/admin/coupon/:id
export const GET = withHandler(
  async ({ params }) => {
    const coupon = await CouponRepository.findById(params!.id)
    if (!coupon) return err("Coupon not found", 404)
    return ok({ data: coupon })
  },
  { access: "admin" }
)

// PUT /api/admin/coupon/:id
export const PUT = withHandler(
  async ({ req, params }: { req: NextRequest; params?: Record<string, string> }) => {
    const body = await req.json()
    const { title, coupon_code, coupon_type, discount_value,
            minimum_order_amount, maximum_discount_amount,
            usage_limit, start_date, expiry_date, is_active } = body

    if (!title?.trim())     return err("Title is required", 400)
    if (discount_value < 0) return err("Discount value cannot be negative", 400)
    if (new Date(expiry_date) <= new Date(start_date))
                            return err("Expiry date must be after start date", 400)

    const coupon = await CouponRepository.update(params!.id, {
      title: title.trim(), coupon_code: coupon_code.trim(),
      coupon_type, discount_value,
      minimum_order_amount: minimum_order_amount ?? 0,
      maximum_discount_amount: maximum_discount_amount ?? null,
      usage_limit: usage_limit ?? null,
      start_date, expiry_date, is_active,
    })
    if (!coupon) return err("Coupon not found", 404)
    return ok({ data: coupon })
  },
  { access: "admin" }
)

// DELETE /api/admin/coupon/:id
export const DELETE = withHandler(
  async ({ params }) => {
    const deleted = await CouponRepository.softDelete(params!.id)
    if (!deleted) return err("Coupon not found", 404)
    return ok({ success: true })
  },
  { access: "admin" }
)

// PATCH /api/admin/coupon/:id  — toggle active
export const PATCH = withHandler(
  async ({ req, params }: { req: NextRequest; params?: Record<string, string> }) => {
    const body = await req.json()
    if (body.generate_code) {
      const code = await generateUniqueCouponCode()
      return ok({ code })
    }
    const coupon = await CouponRepository.toggleActive(params!.id, body.is_active)
    if (!coupon) return err("Coupon not found", 404)
    return ok({ data: coupon })
  },
  { access: "admin" }
)
