import { ReportRange, getReportDateRange } from "../../../domain/helpers/getReportDateRange"
import { getExpenses } from "./getExpenses"
import { getFixedExpenses } from "./getFixedExpenses"
import { getGrossProfit } from "./getGrossProfit"
import { getLowStockItems } from "./getLowStockItems"
import { getNetProfit, getNetLoss, getBreakEvenSales, getMarginOfSafety } from "./getNetProfitOrLoss"
import { getOutstandingPayments } from "./getOutStandingPayments"
import { getRevenue } from "./getRevenue"
import { getSalesBySource } from "./getSalesBySource"
import { getTopSellingProducts } from "./getTopSellingProducts"
import { getTotalExpenses } from "./getTotalExpenses"

export async function getDashboardSummary(
    storeId: number,
    range: ReportRange
) {
    const { startDate, endDate } = getReportDateRange(range)

    const [
        revenue,
        grossProfit,
        totalExpenses,
        fixedExpenses,
        outstandingPayments,
        lowStockItems,
        topSellingProducts,
        salesBySource,
        expenses,
    ] = await Promise.all([
        getRevenue(storeId, startDate, endDate),
        getGrossProfit(storeId, startDate, endDate),
        getTotalExpenses(storeId, startDate, endDate),
        getFixedExpenses(storeId, startDate, endDate),
        getOutstandingPayments(storeId, startDate, endDate),
        getLowStockItems(storeId),
        getTopSellingProducts(storeId, startDate, endDate),
        getSalesBySource(storeId, startDate, endDate),
        getExpenses(storeId, startDate, endDate)
    ])

    const netProfit = await getNetProfit(grossProfit, totalExpenses)
    const netLoss = await getNetLoss(netProfit)
    const breakEvenSales = await getBreakEvenSales(
        revenue,
        grossProfit,
        fixedExpenses
    )
    const marginOfSafety = await getMarginOfSafety(
        revenue,
        breakEvenSales
    )

    return {
        summary: {
            revenue,
            grossProfit,
            netProfit,
            netLoss,
            outstandingPayments,
            breakEvenSales,
            marginOfSafety,
        },
        inventory: {
            lowStockItems,
        },
        products: {
            topSellingProducts,
        },
        sales: {
            salesBySource,
        },
        expenses: {
            fixedExpenses: expenses.fixedExpenses,
            variableExpenses: expenses.variableExpenses,
            otherExpenses: expenses.otherExpenses
        }
    }
}