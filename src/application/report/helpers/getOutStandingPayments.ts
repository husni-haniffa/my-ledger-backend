import { supabaseAdmin } from "../../../config/supabase"

export async function getOutstandingPayments(
  storeId: number,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`
      total_amount,
      payment_status,
      status,
      ordered_at
    `)
    .eq("store_id", storeId)
    .eq("payment_status", "pending")
    .not("status", "in", '("cancelled","returned")')
    .gte("ordered_at", startDate)
    .lte("ordered_at", endDate)

  if (error) {
    throw new Error(error.message)
  }

  const outstandingPayments =
    data?.reduce((sum, order) => {
      return sum + Number(order.total_amount || 0)
    }, 0) || 0

  return outstandingPayments
}