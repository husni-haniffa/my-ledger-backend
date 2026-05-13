import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../domain/errors/errors"
import { updateOrderSchema } from "../../domain/dtos/order"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const updateOrder = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) throw new UnauthorizedError("Unauthorized")

    const result = updateOrderSchema.safeParse(req.body)
    if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message || "Invalid input")
    }

    const payload = result.data
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
        throw new BadRequestError("Only pending orders can be edited")
    }

    const updates: Record<string, unknown> = {}

    if (payload.customer_name !== undefined) updates.customer_name = payload.customer_name || null
    if (payload.customer_phone !== undefined) updates.customer_phone = payload.customer_phone || null
    if (payload.customer_address !== undefined) updates.customer_address = payload.customer_address || null

    if (payload.payment_status !== undefined) updates.payment_status = payload.payment_status
    if (payload.payment_method !== undefined) updates.payment_method = payload.payment_method
    if (payload.source !== undefined) updates.source = payload.source

    if (payload.discount_type !== undefined) updates.discount_type = payload.discount_type
    if (payload.discount_value !== undefined) updates.discount_value = payload.discount_value
    if (payload.delivery_fee !== undefined) updates.delivery_fee = payload.delivery_fee

    if (payload.notes !== undefined) updates.notes = payload.notes || null

    if (Object.keys(updates).length > 0) {
        const { error: orderUpdateError } = await supabaseAdmin
            .from("orders")
            .update(updates)
            .eq("id", id)
            .eq("store_id", store.id)

        if (orderUpdateError) throw new Error(orderUpdateError.message)
    }

    if (payload.items !== undefined) {
        const inventoryIds = payload.items.map((item) => item.inventory_id)

        const { data: inventoryItems, error: inventoryError } = await supabaseAdmin
            .from("inventory")
            .select("id, name, sku, cost_price, selling_price")
            .eq("store_id", store.id)
            .in("id", inventoryIds)
            .is("deleted_at", null)
            .eq("is_active", true)

        if (inventoryError) throw new Error(inventoryError.message)

        if (!inventoryItems || inventoryItems.length !== inventoryIds.length) {
            throw new NotFoundError("One or more inventory items were not found")
        }

        const { error: deleteItemsError } = await supabaseAdmin
            .from("order_items")
            .delete()
            .eq("order_id", id)

        if (deleteItemsError) throw new Error(deleteItemsError.message)

        const newItems = payload.items.map((item) => {
            const inventory = inventoryItems.find((i) => i.id === item.inventory_id)
            if (!inventory) throw new NotFoundError("Inventory item not found")

            return {
                order_id: Number(id),
                inventory_id: inventory.id,
                product_name: inventory.name,
                sku: inventory.sku,
                quantity: item.quantity,
                unit_cost: inventory.cost_price,
                unit_price: inventory.selling_price,
            }
        })

        const { error: insertItemsError } = await supabaseAdmin
            .from("order_items")
            .insert(newItems)

        if (insertItemsError) throw new Error(insertItemsError.message)
    }

    const { data: updatedOrder, error: updatedOrderError } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .eq("store_id", store.id)
        .single()

    if (updatedOrderError) throw new Error(updatedOrderError.message)

    return res.status(200).json({
        message: "Order updated successfully",
        data: updatedOrder,
    })
}