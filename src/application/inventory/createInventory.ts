import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { UnauthorizedError } from "../../domain/errors/errors"
import { createInventorySchema } from "../../domain/dtos/inventory"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const createInventory = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError('UnAuthorized')
    }

    const payload = createInventorySchema.parse(req.body)
    

    try {
        const store = await getUserStore(userId)

        const { data, error } = await supabaseAdmin
            .from("inventory")
            .insert({
                store_id: store.id,
                name: payload.name,
                sku: payload.sku || null,
                category: payload.category || null,
                cost_price: payload.cost_price,
                selling_price: payload.selling_price,
                stock: payload.stock,
                low_stock_threshold: payload.low_stock_threshold ?? 5,
                is_active: true,
            })
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return res.status(201).json({
            message: "Inventory created successfully",
            data,
        })
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        })
    }
}