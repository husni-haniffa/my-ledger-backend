import { supabaseAdmin } from "../../../config/supabase"

export async function getTopSellingProducts(
    storeId: number,
    startDate: string,
    endDate: string
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
      id,
      status,
      ordered_at,
      order_items (
        product_name,
        quantity
      )
    `)
        .eq("store_id", storeId)
        .eq("status", "delivered")
        .gte("ordered_at", startDate)
        .lte("ordered_at", endDate)

    if (error) {
        throw new Error(error.message)
    }

    const productMap = new Map<string, number>()

    data?.forEach(order => {
        order.order_items?.forEach(item => {
            const current = productMap.get(item.product_name) || 0

            productMap.set(
                item.product_name,
                current + Number(item.quantity)
            )
        })
    })

    const products = Array.from(productMap.entries())
        .map(([product_name, total_sold]) => ({
            product_name,
            total_sold,
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 5)

    return products
}