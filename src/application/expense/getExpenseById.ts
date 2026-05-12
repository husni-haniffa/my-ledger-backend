// src/application/expense/get-expense-by-id.ts

import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { NotFoundError, UnauthorizedError } from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const getExpenseById = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const store = await getUserStore(userId)

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
        throw new NotFoundError("Expense not found")
    }

    return res.status(200).json({
        data,
    })
}