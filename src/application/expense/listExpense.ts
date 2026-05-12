// src/application/expense/list-expenses.ts

import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { UnauthorizedError } from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const listExpenses = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const store = await getUserStore(userId)

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .select("*")
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .order("expense_date", { ascending: false })

    if (error) throw new Error(error.message)

    return res.status(200).json({
        data,
    })
}