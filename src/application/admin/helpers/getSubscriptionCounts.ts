import { supabaseAdmin } from "../../../config/supabase"

export async function getSubscriptionCounts() {
    const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("status")

    if (error) throw new Error(error.message)

    const subscriptions = data || []

    return {
        trialing: subscriptions.filter((item) => item.status === "trialing").length,
        active: subscriptions.filter((item) => item.status === "active").length,
        expired: subscriptions.filter((item) => item.status === "expired").length,
        cancelled: subscriptions.filter((item) => item.status === "cancelled").length,
    }
}