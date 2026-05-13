import { getAuth } from "@clerk/express"
import { Request, Response } from "express"

import { supabaseAdmin } from "../../config/supabase"
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from "../../domain/errors/errors"
import { updateOrderStatusSchema } from "../../domain/dtos/order"
import { getUserStore } from "../../domain/helpers/getUserStore"

const allowedTransitions: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["delivered", "cancelled"],
    delivered: ["returned"],
    cancelled: [],
    returned: [],
}

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const result = updateOrderStatusSchema.safeParse(req.body)

    if (!result.success) {
        throw new BadRequestError(
            result.error.issues[0]?.message || "Invalid input"
        )
    }

    const { status: nextStatus } = result.data

    const store = await getUserStore(userId)

    const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("id", id)
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .maybeSingle()

    if (orderError) throw new Error(orderError.message)

    if (!order) {
        throw new NotFoundError("Order not found")
    }

    const currentStatus = order.status

    const isAllowed = allowedTransitions[currentStatus]?.includes(nextStatus)

    if (!isAllowed) {
        throw new BadRequestError(
            `Cannot change order status from ${currentStatus} to ${nextStatus}`
        )
    }

    const { data, error } = await supabaseAdmin
        .from("orders")
        .update({
            status: nextStatus,
        })
        .eq("id", id)
        .eq("store_id", store.id)
        .select("*, order_items(*)")
        .single()

    if (error) throw new Error(error.message)

    return res.status(200).json({
        message: "Order status updated successfully",
        data,
    })
}