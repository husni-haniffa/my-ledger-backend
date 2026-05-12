import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { updateInventorySchema } from "../../domain/dtos/inventory"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const updateInventory = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    const payload = updateInventorySchema.parse(req.body)

    try {
        const store = await getUserStore(userId)

        const updates: Record<string, unknown> = {}

        if (payload.name !== undefined) updates.name = payload.name
        if (payload.sku !== undefined) updates.sku = payload.sku || null
        if (payload.category !== undefined) updates.category = payload.category || null
        if (payload.cost_price !== undefined) updates.cost_price = payload.cost_price
        if (payload.selling_price !== undefined) updates.selling_price = payload.selling_price
        if (payload.stock !== undefined) updates.stock = payload.stock
        if (payload.low_stock_threshold !== undefined) {
            updates.low_stock_threshold = payload.low_stock_threshold
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No fields to update" })
        }

        const { data, error } = await supabaseAdmin
            .from("inventory")
            .update(updates)
            .eq("id", id)
            .eq("store_id", store.id)
            .is("deleted_at", null)
            .select()
            .maybeSingle()

        if (error) {
            return res.status(500).json({ message: error.message })
        }

        if (!data) {
            return res.status(404).json({ message: "Inventory item not found" })
        }

        return res.status(200).json({
            message: "Inventory updated successfully",
            data,
        })
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        })
    }
}