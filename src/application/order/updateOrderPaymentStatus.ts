import { getAuth } from "@clerk/express"
import { Request, Response } from "express"

import { supabaseAdmin } from "../../config/supabase"
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from "../../domain/errors/errors"
import { updateOrderPaymentSchema } from "../../domain/dtos/order"
import { getUserStore } from "../../domain/helpers/getUserStore"


const allowedPaymentTransitions: Record<string, Record<string, string[]>> = {
    pending: {
        pending: ["paid"],
        paid: ["pending"],
        refunded: [],
    },

    processing: {
        pending: ["paid"],
        paid: ["pending"],
        refunded: [],
    },

    delivered: {
        pending: ["paid"],
        paid: ["refunded"],
        refunded: [],
    },

    cancelled: {
        pending: [],
        paid: ["refunded"],
        refunded: [],
    },

    returned: {
        pending: [],
        paid: ["refunded"],
        refunded: [],
    },
}

export const updateOrderPaymentStatus = async (
    req: Request,
    res: Response
) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const result = updateOrderPaymentSchema.safeParse(req.body)

    if (!result.success) {
        throw new BadRequestError(
            result.error.issues[0]?.message || "Invalid input"
        )
    }

    const { payment_status: nextPaymentStatus } = result.data

    const store = await getUserStore(userId)

    const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, status, payment_status")
        .eq("id", id)
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .maybeSingle()

    if (orderError) throw new Error(orderError.message)

    if (!order) {
        throw new NotFoundError("Order not found")
    }

    const currentOrderStatus = order.status
    const currentPaymentStatus = order.payment_status

    if (currentPaymentStatus === nextPaymentStatus) {
        throw new BadRequestError("Payment status is already set")
    }

    const allowedNextStatuses =
        allowedPaymentTransitions[currentOrderStatus]?.[currentPaymentStatus] ?? []

    if (!allowedNextStatuses.includes(nextPaymentStatus)) {
        throw new BadRequestError(
            `Cannot change payment status from ${currentPaymentStatus} to ${nextPaymentStatus} when order is ${currentOrderStatus}`
        )
    }

    const { data, error } = await supabaseAdmin
        .from("orders")
        .update({
            payment_status: nextPaymentStatus,
        })
        .eq("id", id)
        .eq("store_id", store.id)
        .select("*, order_items(*)")
        .single()

    if (error) throw new Error(error.message)

    return res.status(200).json({
        message: "Payment status updated successfully",
        data,
    })
}