import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { UnauthorizedError } from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"

export const listOrders = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    if (!userId) throw new UnauthorizedError("Unauthorized")

    const store = await getUserStore(userId)

    const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .order("ordered_at", { ascending: false })

    if (error) throw new Error(error.message)

    return res.status(200).json({ data })
}