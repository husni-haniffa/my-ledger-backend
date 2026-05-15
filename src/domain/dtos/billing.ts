import { z } from "zod"

export const createPaymentSchema = z.object({
    plan_slug: z.string().min(1).default("pro"),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>