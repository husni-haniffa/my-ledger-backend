import { supabaseAdmin } from "../../../config/supabase"

export async function getFixedExpenses(
    storeId: number,
    startDate: string,
    endDate: string
) {
    const startDateOnly = startDate.slice(0, 10)
    const endDateOnly = endDate.slice(0, 10)

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .select("amount, expense_type")
        .eq("store_id", storeId)
        .eq("expense_type", "fixed")
        .is("deleted_at", null)
        .gte("expense_date", startDateOnly)
        .lte("expense_date", endDateOnly)

    if (error) throw new Error(error.message)

    return data?.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0)
    }, 0) || 0
}