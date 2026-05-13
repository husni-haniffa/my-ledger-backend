export async function getNetProfit(
    grossProfit: number,
    totalExpenses: number
) {
    return grossProfit - totalExpenses
}

export async function getNetLoss(netProfit: number) {
    return netProfit < 0 ? Math.abs(netProfit) : 0
}

export async function getBreakEvenSales(
    revenue: number,
    grossProfit: number,
    fixedExpenses: number
) {
    const contributionMarginRatio =
        revenue > 0 ? grossProfit / revenue : 0

    return contributionMarginRatio > 0
        ? fixedExpenses / contributionMarginRatio
        : 0
}

export async function getMarginOfSafety(
    revenue: number,
    breakEvenSales: number
) {
    return revenue - breakEvenSales
}