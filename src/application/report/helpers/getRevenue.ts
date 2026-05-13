import { supabaseAdmin } from "../../../config/supabase"

export async function getRevenue(
    storeId: number,
    startDate: string,
    endDate: string
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select("total_amount")
        .eq("store_id", storeId)
        .eq("status", "delivered")
        .gte("ordered_at", startDate)
        .lte("ordered_at", endDate)

    if (error) throw new Error(error.message)

    return data?.reduce((sum, order) => {
        return sum + Number(order.total_amount || 0)
    }, 0) || 0
}