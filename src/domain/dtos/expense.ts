// src/application/expense/expense.schema.ts

import { z } from "zod"

export const createExpenseSchema = z.object({
    name: z.string().min(2, "Expense name is required").max(120).trim(),

    category: z.string().max(100).optional().or(z.literal("")),

    expense_type: z.enum(["fixed", "variable", "one_time"]),

    amount: z.coerce.number().min(0, "Amount cannot be negative"),

    expense_date: z.string().date("Invalid expense date"),

    notes: z.string().max(500).optional().or(z.literal("")),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>