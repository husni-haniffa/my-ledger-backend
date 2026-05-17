import { supabaseAdmin } from "../../../config/supabase"

export async function getRecentPayments() {
    const { data, error } = await supabaseAdmin
        .from("saas_payments")
        .select(`
      id,
      order_reference,
      gateway_reference,
      amount,
      currency,
      status,
      paid_at,
      created_at,
      stores (
        id,
        name
      )
    `)
        .order("created_at", { ascending: false })
        .limit(5)

    if (error) throw new Error(error.message)

    return data || []
}