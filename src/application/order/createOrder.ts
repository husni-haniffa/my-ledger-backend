import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../domain/errors/errors"
import { createOrderSchema } from "../../domain/dtos/order"
import { getUserStore } from "../../domain/helpers/getUserStore"

export const createOrder = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    if (!userId) throw new UnauthorizedError("Unauthorized")

    const result = createOrderSchema.safeParse(req.body)
    if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message || "Invalid input")
    }

    const payload = result.data
    const store = await getUserStore(userId)

    const inventoryIds = payload.items.map((item) => item.inventory_id)

    const { data: inventoryItems, error: inventoryError } = await supabaseAdmin
        .from("inventory")
        .select("id, name, sku, cost_price, selling_price, stock")
        .eq("store_id", store.id)
        .in("id", inventoryIds)
        .is("deleted_at", null)
        .eq("is_active", true)

    if (inventoryError) throw new Error(inventoryError.message)

    if (!inventoryItems || inventoryItems.length !== inventoryIds.length) {
        throw new NotFoundError("One or more inventory items were not found")
    }

    const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
            store_id: store.id,
            order_number: "",
            status: "pending",

            customer_name: payload.customer_name || null,
            customer_phone: payload.customer_phone || null,
            customer_address: payload.customer_address || null,

            payment_status: payload.payment_status,
            payment_method: payload.payment_method,
            source: payload.source,

            discount_type: payload.discount_type,
            discount_value: payload.discount_value,
            delivery_fee: payload.delivery_fee,

            notes: payload.notes || null,
        })
        .select()
        .single()

    if (orderError) throw new Error(orderError.message)

    const orderItems = payload.items.map((item) => {
        const inventory = inventoryItems.find((i) => i.id === item.inventory_id)
        if (!inventory) throw new NotFoundError("Inventory item not found")

        return {
            order_id: order.id,
            inventory_id: inventory.id,
            product_name: inventory.name,
            sku: inventory.sku,
            quantity: item.quantity,
            unit_cost: inventory.cost_price,
            unit_price: inventory.selling_price,
        }
    })

    const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems)

    if (itemsError) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id)
        throw new Error(itemsError.message)
    }

    const { data: createdOrder, error: createdOrderError } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", order.id)
        .single()

    if (createdOrderError) throw new Error(createdOrderError.message)

    return res.status(201).json({
        message: "Order created successfully",
        data: createdOrder,
    })
}