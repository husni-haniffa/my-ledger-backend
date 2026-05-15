import { supabaseAdmin } from "../../../config/supabase"

export async function getPaymentSummary() {
    const now = new Date()

    const firstDayOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    ).toISOString()

    const { data, error } = await supabaseAdmin
        .from("saas_payments")
        .select("amount, status, paid_at")

    if (error) throw new Error(error.message)

    const payments = data || []

    const paidPayments = payments.filter((item) => item.status === "paid")

    const totalRevenue = paidPayments.reduce((sum, item) => {
        return sum + Number(item.amount || 0)
    }, 0)

    const monthlyRevenue = paidPayments
        .filter((item) => {
            if (!item.paid_at) return false
            return new Date(item.paid_at) >= new Date(firstDayOfMonth)
        })
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0)
        }, 0)

    return {
        totalRevenue,
        monthlyRevenue,
        paid: paidPayments.length,
        pending: payments.filter((item) => item.status === "pending").length,
        failed: payments.filter((item) => item.status === "failed").length,
        refunded: payments.filter((item) => item.status === "refunded").length,
    }
}