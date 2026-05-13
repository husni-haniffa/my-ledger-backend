import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const deleteOrder = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) throw new UnauthorizedError("Unauthorized")

    const store = await getUserStore(userId)

    const { data: existingOrder, error: existingError } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("id", id)
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .maybeSingle()

    if (existingError) throw new Error(existingError.message)
    if (!existingOrder) throw new NotFoundError("Order not found")

    if (existingOrder.status !== "pending") {
        throw new BadRequestError("Only pending orders can be deleted")
    }

    const { data, error } = await supabaseAdmin
        .from("orders")
        .update({
            deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("store_id", store.id)
        .select("*, order_items(*)")
        .single()

    if (error) throw new Error(error.message)

    return res.status(200).json({
        message: "Order deleted successfully",
        data,
    })
}