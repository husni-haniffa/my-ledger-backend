import { clerkClient, getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { createAccountSchema } from "../../domain/dtos/account"
import { BadRequestError, ConflictError, UnauthorizedError } from "../../domain/errors/errors"


export const createAccount = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError('UnAuthorized')
    }

    const clerkUser = await clerkClient.users.getUser(userId)

    const email = clerkUser.emailAddresses[0]?.emailAddress
    const fullName = `${clerkUser.firstName} ${clerkUser.lastName}`

    const payload = createAccountSchema.parse(req.body)


    const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", userId)
        .maybeSingle()

    if (existingUserError) {
        throw new Error(existingUserError.message)
    }

    if (existingUser) {
        throw new ConflictError("Account already exists")
    }

    const { data: plan, error: planError } = await supabaseAdmin
        .from("plans")
        .select("id, trial_days")
        .eq("slug", "free")
        .eq("is_active", true)
        .single()

    if (planError || !plan) {
        throw new Error('Account plan not found')
    }

    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + Number(plan.trial_days || 30))

    const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
            clerk_user_id: userId,
            email,
            full_name: fullName,
            status: "active",
        })
        .select()
        .single()

    if (userError) {
        throw new Error(userError.message)
    }

    const { data: store, error: storeError } = await supabaseAdmin
        .from("stores")
        .insert({
            user_id: user.id,
            name: payload.store_name,
            email: payload.store_email || null,
            phone_number: payload.store_phone_number || null,
            address: payload.store_address || null,
            status: "active",
        })
        .select()
        .single()

    if (storeError) {
        throw new Error(storeError.message)
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
            user_id: user.id,
            store_id: store.id,
            plan_id: plan.id,
            status: "trialing",
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString(),
            current_period_start: now.toISOString(),
            current_period_end: trialEnd.toISOString(),
        })
        .select()
        .single()

    if (subscriptionError) {
        throw new Error(subscriptionError.message)
    }

    return res.status(201).json({
        message: "Account created successfully",
        data: {
            user,
            store,
            subscription,
        },
    })
}