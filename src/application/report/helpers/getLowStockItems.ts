import { supabaseAdmin } from "../../../config/supabase"

export async function getLowStockItems(
    storeId: number
) {
    const { data, error } = await supabaseAdmin
        .from("inventory")
        .select(`
      id,
      name,
      stock,
      low_stock_threshold
    `)
        .eq("store_id", storeId)
        .eq("is_active", true)

    if (error) {
        throw new Error(error.message)
    }

    const lowStockItems =
        data
            ?.filter(item => item.stock <= item.low_stock_threshold)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5) || []

    return lowStockItems
}