import { z } from "zod"

export const orderItemSchema = z.object({
    inventory_id: z.coerce.number().int().positive("Inventory item is required"),
    quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
})

export const createOrderSchema = z
    .object({
        customer_name: z.string().max(120).optional().or(z.literal("")),
        customer_phone: z.string().max(20).optional().or(z.literal("")),
        customer_address: z.string().max(500).optional().or(z.literal("")),

        payment_status: z.enum(["pending", "paid", "refunded"]).default("pending"),
        payment_method: z.enum(["cash", "bank_transfer", "card", "cod", "koko", "other"]).default("other"),
        source: z.enum(["instagram", "facebook", "whatsapp", "tiktok", "website", "manual", "other"]).default("manual"),

        discount_type: z.enum(["none", "fixed", "percentage"]).default("none"),
        discount_value: z.coerce.number().min(0).default(0),
        delivery_fee: z.coerce.number().min(0).default(0),

        notes: z.string().max(500).optional().or(z.literal("")),

        items: z.array(orderItemSchema).min(1, "At least one product is required"),
    })
    .refine(
        (data) => data.discount_type !== "percentage" || data.discount_value <= 100,
        {
            message: "Percentage discount cannot be more than 100%",
            path: ["discount_value"],
        }
    )
    .refine(
        (data) => data.discount_type !== "none" || data.discount_value === 0,
        {
            message: "Discount must be 0 when discount type is none",
            path: ["discount_value"],
        }
    )

export const updateOrderSchema = createOrderSchema

export const updateOrderStatusSchema = z.object({
    status: z.enum(["processing", "delivered", "cancelled", "returned"]),
})
export const updateOrderPaymentSchema = z.object({
    payment_status: z.enum(["pending", "paid", "refunded"]),
})

export type UpdateOrderPaymentInput =
    z.infer<typeof updateOrderPaymentSchema>

export type UpdateOrderStatusInput =
    z.infer<typeof updateOrderStatusSchema>

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>