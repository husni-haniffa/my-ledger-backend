import { supabaseAdmin } from "../../../config/supabase"

export async function getSalesBySource(
    storeId: number,
    startDate: string,
    endDate: string
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
      source,
      total_amount
    `)
        .eq("store_id", storeId)
        .eq("status", "delivered")
        .gte("ordered_at", startDate)
        .lte("ordered_at", endDate)

    if (error) {
        throw new Error(error.message)
    }

    const sourceMap = new Map<string, number>()

    data?.forEach(order => {
        const source = order.source || "other"
        const currentRevenue = sourceMap.get(source) || 0

        sourceMap.set(
            source,
            currentRevenue + Number(order.total_amount || 0)
        )
    })

    const salesBySource = Array.from(sourceMap.entries())
        .map(([source, revenue]) => ({
            source,
            revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)

    return salesBySource
}