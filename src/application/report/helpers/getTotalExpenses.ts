import { supabaseAdmin } from "../../../config/supabase"

export async function getTotalExpenses(
    storeId: number,
    startDate: string,
    endDate: string
) {
    const startDateOnly = startDate.slice(0, 10)
    const endDateOnly = endDate.slice(0, 10)

    const { data, error } = await supabaseAdmin
        .from("expenses")
        .select("amount")
        .eq("store_id", storeId)
        .is("deleted_at", null)
        .gte("expense_date", startDateOnly)
        .lte("expense_date", endDateOnly)

    if (error) throw new Error(error.message)

    return data?.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0)
    }, 0) || 0
}