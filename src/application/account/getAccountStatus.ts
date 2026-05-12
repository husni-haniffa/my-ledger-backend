import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { UnauthorizedError } from "../../domain/errors/errors"

export const getAccountStatus = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError('UnAuthorized')
    }

    const { data: user, error } = await supabaseAdmin
        .from("users")
        .select(`
      id,
      clerk_user_id,
      email,
      status,
      stores (
        id,
        name,
        email,
        phone_number,
        address,
        status,
        currency,
        timezone
      ),
      subscriptions (
        id,
        status,
        current_period_end,
        trial_end,
        plans (
          id,
          name,
          slug,
          price,
          currency,
          billing_period
        )
      )
    `)
        .eq("clerk_user_id", userId)
        .maybeSingle()
    

    if (error) {
       throw new Error(error.message)
    }

    // 1. User does not exist in our database yet
    if (!user) {
        return res.status(200).json({
            hasAccount: false,
            hasAccess: false,
            nextAction: "create_account",
            data: null,
        })
    }

    const store = Array.isArray(user.stores) ? user.stores[0] : user.stores

    const subscription = Array.isArray(user.subscriptions)
        ? user.subscriptions[0]
        : user.subscriptions

    // 2. User exists, but store/subscription missing
    if (!store || !subscription) {
        return res.status(200).json({
            hasAccount: false,
            hasAccess: false,
            nextAction: "create_account",
            data: {
                user,
                store: store ?? null,
                subscription: subscription ?? null,
            },
        })
    }

    const now = new Date()
    const periodEnd = new Date(subscription.current_period_end)

    const isValidSubscription =
        (subscription.status === "trialing" || subscription.status === "active") &&
        periodEnd >= now

    // 3. User can access dashboard
    if (isValidSubscription && store.status === "active") {
        return res.status(200).json({
            hasAccount: true,
            hasAccess: true,
            nextAction: "dashboard",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    status: user.status,
                },
                store,
                subscription,
            },
        })
    }

    // 4. User exists, but subscription expired/not active
    return res.status(200).json({
        hasAccount: true,
        hasAccess: false,
        nextAction: "billing",
        data: {
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
            },
            store,
            subscription,
        },
    })
}