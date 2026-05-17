import { NextFunction, Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"



function getMonthKey(date: string) {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export const getAdminAnalytics = async (req: Request, res: Response, next: NextFunction) => {
   
    try {
        const [
            subscriptionsResult,
            paymentsResult,
            usersResult,
            plansResult,
        ] = await Promise.all([
            supabaseAdmin
                .from("subscriptions")
                .select(`
        id,
        status,
        created_at,
        plans (
          price,
          billing_period
        )
      `),

            supabaseAdmin
                .from("saas_payments")
                .select(`
        id,
        amount,
        status,
        paid_at,
        created_at
      `),

            supabaseAdmin
                .from("users")
                .select("id, created_at")
                .is("deleted_at", null),

            supabaseAdmin
                .from("plans")
                .select("id, price, billing_period, is_active")
                .eq("is_active", true),
        ])

        if (subscriptionsResult.error) {
            throw new Error(subscriptionsResult.error.message)
        }

        if (paymentsResult.error) {
            throw new Error(paymentsResult.error.message)
        }

        if (usersResult.error) {
            throw new Error(usersResult.error.message)
        }

        if (plansResult.error) {
            throw new Error(plansResult.error.message)
        }

        const subscriptions = subscriptionsResult.data || []
        const payments = paymentsResult.data || []
        const users = usersResult.data || []

        const activeSubscriptions = subscriptions.filter(
            (item) => item.status === "active"
        )

        const trialingSubscriptions = subscriptions.filter(
            (item) => item.status === "trialing"
        )

        const expiredSubscriptions = subscriptions.filter(
            (item) => item.status === "expired"
        )

        const cancelledSubscriptions = subscriptions.filter(
            (item) => item.status === "cancelled"
        )

        const mrr = activeSubscriptions.reduce((sum, sub) => {
            const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans

            if (!plan) return sum

            if (plan.billing_period === "monthly") {
                return sum + Number(plan.price || 0)
            }

            if (plan.billing_period === "yearly") {
                return sum + Number(plan.price || 0) / 12
            }

            return sum
        }, 0)

        const totalSubscriptions = subscriptions.length

        const conversionRate =
            totalSubscriptions > 0
                ? (activeSubscriptions.length / totalSubscriptions) * 100
                : 0

        const paidOrExpiredUsers =
            activeSubscriptions.length +
            expiredSubscriptions.length +
            cancelledSubscriptions.length

        const churnRate =
            paidOrExpiredUsers > 0
                ? ((expiredSubscriptions.length + cancelledSubscriptions.length) /
                    paidOrExpiredUsers) *
                100
                : 0

        const signupsByMonthMap = new Map<string, number>()

        users.forEach((user) => {
            const month = getMonthKey(user.created_at)
            signupsByMonthMap.set(month, (signupsByMonthMap.get(month) || 0) + 1)
        })

        const signupsByMonth = Array.from(signupsByMonthMap.entries()).map(
            ([month, count]) => ({
                month,
                count,
            })
        )

        const revenueByMonthMap = new Map<string, number>()

        payments
            .filter((payment) => payment.status === "paid" && payment.paid_at)
            .forEach((payment) => {
                const month = getMonthKey(payment.paid_at!)
                revenueByMonthMap.set(
                    month,
                    (revenueByMonthMap.get(month) || 0) + Number(payment.amount || 0)
                )
            })

        const revenueByMonth = Array.from(revenueByMonthMap.entries()).map(
            ([month, revenue]) => ({
                month,
                revenue,
            })
        )

        const paymentsByStatus = {
            paid: payments.filter((item) => item.status === "paid").length,
            pending: payments.filter((item) => item.status === "pending").length,
            failed: payments.filter((item) => item.status === "failed").length,
            refunded: payments.filter((item) => item.status === "refunded").length,
            cancelled: payments.filter((item) => item.status === "cancelled").length,
        }

        return res.status(200).json({
            data: {
                mrr,
                conversionRate,
                churnRate,

                subscriptions: {
                    active: activeSubscriptions.length,
                    trialing: trialingSubscriptions.length,
                    expired: expiredSubscriptions.length,
                    cancelled: cancelledSubscriptions.length,
                },

                signupsByMonth,
                revenueByMonth,
                paymentsByStatus,
            },
        })
    } catch (error) {
        next(error)
    }
  
}