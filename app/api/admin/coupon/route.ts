import { ok, okList, err, withHandler } from "@/lib/api/handler"
import { CouponRepository, generateUniqueCouponCode } from "@/lib/db/repositories/admin/coupon.repository"
import { NextRequest } from "next/server"

// GET /api/admin/coupon?page=1&limit=20
export const GET = withHandler(
  async ({ req }: { req: NextRequest }) => {
    const { searchParams } = new URL(req.url)
    const page  = Math.max(Number(searchParams.get("page")  ?? 1), 1)
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100)
    const { data, total } = await CouponRepository.findAll(page, limit)
    return okList(data, { page, limit, total, totalPages: Math.ceil(total / limit) })
  },
  { access: "admin" }
)

// POST /api/admin/coupon
export const POST = withHandler(
  async ({ req }: { req: NextRequest }) => {
    const body = await req.json()
    const { title, coupon_code, coupon_type, discount_value,
            minimum_order_amount, maximum_discount_amount,
            usage_limit, start_date, expiry_date, is_active } = body

    if (!title?.trim())         return err("Title is required", 400)
    if (discount_value < 0)     return err("Discount value cannot be negative", 400)
    if (new Date(expiry_date) <= new Date(start_date))
                                return err("Expiry date must be after start date", 400)
    if (coupon_type === "PERCENTAGE" && discount_value > 100)
                                return err("Percentage discount cannot exceed 100", 400)

    const code = coupon_code?.trim() || await generateUniqueCouponCode()
    const coupon = await CouponRepository.create({
      title: title.trim(), coupon_code: code, coupon_type, discount_value,
      minimum_order_amount: minimum_order_amount ?? 0,
      maximum_discount_amount: maximum_discount_amount ?? null,
      usage_limit: usage_limit ?? null,
      start_date, expiry_date, is_active: is_active ?? true,
    })
    return ok({ data: coupon }, 201)
  },
  { access: "admin" }
)

// GET /api/admin/coupon/generate-code — returns a fresh unique code
export const PATCH = withHandler(
  async () => {
    const code = await generateUniqueCouponCode()
    return ok({ code })
  },
  { access: "admin" }
)
