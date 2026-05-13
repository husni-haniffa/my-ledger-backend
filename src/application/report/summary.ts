import { Request, Response, NextFunction } from "express";
import { getReportDateRange, ReportRange } from "../../domain/helpers/getReportDateRange";
import { getDashboardSummary } from "./helpers/getSummary";

export const getSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const range = String(req.query.range || "7d") as ReportRange

        // temporary for now
        const storeId = 1

        const dashboard = await getDashboardSummary(storeId, range)

        return res.json({
            data: dashboard,
        })
    } catch (error) {
        next(error)
    }
}