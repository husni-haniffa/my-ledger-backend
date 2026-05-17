import { NextFunction, Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"



export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
    
    try {
        const { data, error } = await supabaseAdmin
            .from("stores")
            .select(`
      id,
      name,
      email,
      phone_number,
      address,
      status,
      currency,
      timezone,
      created_at,
      users (
        id,
        email,
        status,
        created_at
      ),
      subscriptions (
        id,
        status,
        trial_start,
        trial_end,
        current_period_start,
        current_period_end,
        cancelled_at,
        plans (
          id,
          name,
          slug,
          price,
          currency,
          billing_period
        )
      ),
      saas_payments (
        id,
        amount,
        currency,
        status,
        paid_at,
        created_at
      )
    `)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })

        if (error) {
            throw new Error(error.message)
        }

        const users = (data || []).map((store) => {
            const subscription = Array.isArray(store.subscriptions)
                ? store.subscriptions[0]
                : store.subscriptions

            const latestPayment = Array.isArray(store.saas_payments)
                ? store.saas_payments.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                )[0]
                : null

            return {
                store_id: store.id,
                store_name: store.name,
                store_email: store.email,
                store_phone_number: store.phone_number,
                store_address: store.address,
                store_status: store.status,
                currency: store.currency,
                timezone: store.timezone,
                created_at: store.created_at,

                user: Array.isArray(store.users) ? store.users[0] : store.users,

                subscription: subscription ?? null,

                latest_payment: latestPayment ?? null,
            }
        })

        return res.status(200).json({
            data: users,
        })
    } catch (error) {
        next(error)
    }

   
}