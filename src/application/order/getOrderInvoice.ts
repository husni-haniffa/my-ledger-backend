import { getAuth } from "@clerk/express"
import { Request, Response } from "express"

import { supabaseAdmin } from "../../config/supabase"
import {
    NotFoundError,
    UnauthorizedError,
} from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const getOrderInvoice = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const store = await getUserStore(userId)

    const { data: storeDetails, error: storeError } = await supabaseAdmin
        .from("stores")
        .select(`
      id,
      name,
      email,
      phone_number,
      address,
      currency,
      timezone
    `)
        .eq("id", store.id)
        .is("deleted_at", null)
        .maybeSingle()

    if (storeError) throw new Error(storeError.message)

    if (!storeDetails) {
        throw new NotFoundError("Store not found")
    }

    const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select(`
      id,
      order_number,
      customer_name,
      customer_phone,
      customer_address,
      status,
      payment_status,
      payment_method,
      source,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      delivery_fee,
      total_amount,
      notes,
      ordered_at,
      created_at,
      order_items (
        id,
        product_name,
        sku,
        quantity,
        unit_price,
        total_price
      )
    `)
        .eq("id", id)
        .eq("store_id", store.id)
        .is("deleted_at", null)
        .maybeSingle()

    if (orderError) throw new Error(orderError.message)

    if (!order) {
        throw new NotFoundError("Order not found")
    }

    return res.status(200).json({
        data: {
            store: storeDetails,
            order,
        },
    })
}