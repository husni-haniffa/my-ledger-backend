// src/application/expense/delete-expense.ts

import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { NotFoundError, UnauthorizedError } from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const deleteExpense = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const store = await getUserStore(userId)

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .update({
            deleted_at: new Date().toISOString(),
        })
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
        message: "Expense deleted successfully",
        data,
    })
}