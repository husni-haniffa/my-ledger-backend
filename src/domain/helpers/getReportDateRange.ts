
export type ReportRange = "today" | "7d" | "30d" | "year"

export function getReportDateRange(range: ReportRange) {
    const now = new Date()

    const endDate = new Date(now)
    const startDate = new Date(now)

    if (range === "today") {
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    else if (range === "7d") {
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    else if (range === "30d") {
        startDate.setDate(now.getDate() - 29)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    else if (range === "year") {
        startDate.setFullYear(now.getFullYear(), 0, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    else {
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    }
}

