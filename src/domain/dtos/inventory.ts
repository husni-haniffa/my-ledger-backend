import { z } from "zod"

export const createInventorySchema = z.object({
    name: z.string().min(2, "Product name is required").max(120).trim(),

    sku: z.string().max(80).optional().or(z.literal("")),

    category: z.string().max(100).optional().or(z.literal("")),

    cost_price: z.coerce.number().min(0, "Cost price cannot be negative"),

    selling_price: z.coerce.number().min(0, "Selling price cannot be negative"),

    stock: z.coerce.number().int().min(0, "Stock cannot be negative"),

    low_stock_threshold: z.coerce
        .number()
        .int()
        .min(0)
        .optional()
        .default(5),
})

export const updateInventorySchema = createInventorySchema.partial()

export type CreateInventoryInput = z.infer<typeof createInventorySchema>
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>