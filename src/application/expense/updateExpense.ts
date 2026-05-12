// src/application/expense/update-expense.ts

import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from "../../domain/errors/errors"
import { updateExpenseSchema } from "../../domain/dtos/expense"
import { getUserStore } from "../../domain/helpers/getUserStore"

export const updateExpense = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const result = updateExpenseSchema.safeParse(req.body)

    if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message || "Invalid input")
    }

    const payload = result.data
    const store = await getUserStore(userId)

    const updates: Record<string, unknown> = {}

    if (payload.name !== undefined) updates.name = payload.name
    if (payload.category !== undefined) updates.category = payload.category || null
    if (payload.expense_type !== undefined) updates.expense_type = payload.expense_type
    if (payload.amount !== undefined) updates.amount = payload.amount
    if (payload.expense_date !== undefined) updates.expense_date = payload.expense_date
    if (payload.notes !== undefined) updates.notes = payload.notes || null

    if (Object.keys(updates).length === 0) {
        throw new BadRequestError("No fields to update")
    }

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .select()
        .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
        throw new NotFoundError("Expense not found")
    }

    return res.status(200).json({
        message: "Expense updated successfully",
        data,
    })
}