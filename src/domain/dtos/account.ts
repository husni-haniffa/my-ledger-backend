import { z } from "zod"

export const createAccountSchema = z.object({
    store_name: z.string().min(2, "Store name is required").max(120).trim(),

    store_email: z
        .string()
        .email("Invalid store email")
        .optional()
        .or(z.literal("")),

    store_phone_number: z
        .string()
        .min(7, "Phone number is too short")
        .max(20, "Phone number is too long")
        .optional()
        .or(z.literal("")),

    store_address: z
        .string()
        .max(500, "Address is too long")
        .optional()
        .or(z.literal("")),
})

export const updateAccountSchema = createAccountSchema.partial()

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>