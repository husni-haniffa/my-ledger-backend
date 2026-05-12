// src/application/expense/create-expense.ts

import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { BadRequestError, UnauthorizedError } from "../../domain/errors/errors"
import { createExpenseSchema } from "../../domain/dtos/expense"
import { getUserStore } from "../../domain/helpers/getUserStore"

export const createExpense = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const result = createExpenseSchema.safeParse(req.body)

    if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message || "Invalid input")
    }

    const payload = result.data
    const store = await getUserStore(userId)

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .insert({
            store_id: store.id,
            name: payload.name,
            category: payload.category || null,
            expense_type: payload.expense_type,
            amount: payload.amount,
            expense_date: payload.expense_date,
            notes: payload.notes || null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    return res.status(201).json({
        message: "Expense created successfully",
        data,
    })
}