import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { getUserStore } from "../../domain/helpers/getUserStore"


export const getInventoryById = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)
    const { id } = req.params

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    try {
        const store = await getUserStore(userId)

        const { data, error } = await supabaseAdmin
            .from("inventory")
            .select("*")
            .eq("id", id)
            .eq("store_id", store.id)
            .is("deleted_at", null)
            .maybeSingle()

        if (error) {
            return res.status(500).json({ message: error.message })
        }

        if (!data) {
            return res.status(404).json({ message: "Inventory item not found" })
        }

        return res.status(200).json({
            data,
        })
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        })
    }
}