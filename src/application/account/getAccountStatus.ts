import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { UnauthorizedError } from "../../domain/errors/errors"

export const getAccountStatus = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
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

    let finalSubscription = subscription

    if (
        periodEnd < now &&
        (subscription.status === "trialing" || subscription.status === "active")
    ) {
        const { data: updatedSubscription, error: updateError } =
            await supabaseAdmin
                .from("subscriptions")
                .update({
                    status: "expired",
                })
                .eq("id", subscription.id)
                .select(`
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
        `)
                .single()

        if (updateError) {
            throw new Error(updateError.message)
        }

        finalSubscription = updatedSubscription
    }

    const isValidSubscription =
        (finalSubscription.status === "trialing" ||
            finalSubscription.status === "active") &&
        new Date(finalSubscription.current_period_end) >= now

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
                subscription: finalSubscription,
            },
        })
    }

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
            subscription: finalSubscription,
        },
    })
}