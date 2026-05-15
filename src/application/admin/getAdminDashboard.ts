import { NextFunction, Request, Response } from "express"
import { getPaymentSummary } from "./helpers/getPaymentSummary"
import { getRecentPayments } from "./helpers/getRecentPayment"
import { getRecentSignups } from "./helpers/getRecentSignUps"
import { getSubscriptionCounts } from "./helpers/getSubscriptionCounts"
import { getTotalStores } from "./helpers/getTotalStores"
import { getTotalUsers } from "./helpers/getTotalUsers"

export const getAdminDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const [
            totalUsers,
            totalStores,
            subscriptions,
            payments,
            recentSignups,
            recentPayments,
        ] = await Promise.all([
            getTotalUsers(),
            getTotalStores(),
            getSubscriptionCounts(),
            getPaymentSummary(),
            getRecentSignups(),
            getRecentPayments(),
        ])

        return res.status(200).json({
            data: {
                overview: {
                    totalUsers,
                    totalStores,
                    trialingUsers: subscriptions.trialing,
                    activePaidUsers: subscriptions.active,
                    expiredUsers: subscriptions.expired,
                    cancelledUsers: subscriptions.cancelled,
                    totalRevenue: payments.totalRevenue,
                    monthlyRevenue: payments.monthlyRevenue,
                    pendingPayments: payments.pending,
                    failedPayments: payments.failed,
                },
                recent: {
                    signups: recentSignups,
                    payments: recentPayments,
                },
            },
        })
    } catch (error) {
        next(error)
    }
   
}