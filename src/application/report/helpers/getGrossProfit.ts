import { supabaseAdmin } from "../../../config/supabase"

export async function getGrossProfit(
    storeId: number,
    startDate: string,
    endDate: string
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
      id,
      order_items (
        total_price,
        total_cost
      )
    `)
        .eq("store_id", storeId)
        .eq("status", "delivered")
        .gte("ordered_at", startDate)
        .lte("ordered_at", endDate)

    if (error) throw new Error(error.message)

    return data?.reduce((sum, order) => {
        const orderProfit =
            order.order_items?.reduce((itemSum, item) => {
                return itemSum + Number(item.total_price || 0) - Number(item.total_cost || 0)
            }, 0) || 0

        return sum + orderProfit
    }, 0) || 0
}