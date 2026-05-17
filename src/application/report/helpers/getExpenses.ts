import { supabaseAdmin } from "../../../config/supabase"

export async function getExpenses(
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
        .is("deleted_at", null)
        .gte("expense_date", startDateOnly)
        .lte("expense_date", endDateOnly)

    if (error) throw new Error(error.message)

    let fixedExpenses = 0
    let variableExpenses = 0
    let otherExpenses = 0

    data?.forEach((expense) => {
        const amount = Number(expense.amount || 0)

        if (expense.expense_type === "fixed") {
            fixedExpenses += amount
        }

        if (expense.expense_type === "variable") {
            variableExpenses += amount
        }

        if (expense.expense_type === "other") {
            otherExpenses += amount
        }
    })

    return {
        fixedExpenses,
        variableExpenses,
        otherExpenses,
    }
}