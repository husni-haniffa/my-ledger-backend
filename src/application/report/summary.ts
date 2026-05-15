import { Request, Response, NextFunction } from "express";
import { getReportDateRange, ReportRange } from "../../domain/helpers/getReportDateRange";
import { getDashboardSummary } from "./helpers/getSummary";
import { getAuth } from "@clerk/express";
import { getUserStore } from "../../domain/helpers/getUserStore";
import { UnauthorizedError } from "../../domain/errors/errors";

export const getSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const range = String(req.query.range || "7d") as ReportRange

        const { userId } = getAuth(req)
        if(!userId) {
            throw new UnauthorizedError('UnAuthorized')
        }
        const store = await getUserStore(userId)

        const dashboard = await getDashboardSummary(store.id, range)

        return res.json({
            data: dashboard,
        })
    } catch (error) {
        next(error)
    }
}