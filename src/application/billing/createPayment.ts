import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import NodeRSA from "node-rsa"

import { supabaseAdmin } from "../../config/supabase"
import {
    BadRequestError,
    UnauthorizedError,
} from "../../domain/errors/errors"
import { getUserStore } from "../../domain/helpers/getUserStore"
import { createPaymentSchema } from "../../domain/dtos/billing"


const WEBXPAY_CHECKOUT_URL =
    "https://stagingxpay.info/index.php?route=checkout/billing"

const WEBXPAY_PUBLIC_KEY = process.env.WEBXPAY_PUBLIC_KEY!
const WEBXPAY_SECRET_KEY = process.env.WEBXPAY_SECRET_KEY!

export const createPayment = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError("Unauthorized")
    }

    const result = createPaymentSchema.safeParse(req.body)

    if (!result.success) {
        throw new BadRequestError(
            result.error.issues[0]?.message || "Invalid input"
        )
    }

    const { plan_slug } = result.data

    const store = await getUserStore(userId)

    const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("clerk_user_id", userId)
        .maybeSingle()

    if (userError) throw new Error(userError.message)
    if (!user) throw new BadRequestError("User not found")

    const { data: plan, error: planError } = await supabaseAdmin
        .from("plans")
        .select("id, name, slug, price, currency, billing_period")
        .eq("slug", plan_slug)
        .eq("is_active", true)
        .maybeSingle()

    if (planError) throw new Error(planError.message)
    if (!plan) throw new BadRequestError("Plan not found")

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("store_id", store.id)
        .maybeSingle()

    if (subscriptionError) throw new Error(subscriptionError.message)
    if (!subscription) throw new BadRequestError("Subscription not found")

    const orderReference = `MYLEDGER-${store.id}-${Date.now()}`

    const { data: paymentRow, error: paymentError } = await supabaseAdmin
        .from("saas_payments")
        .insert({
            user_id: user.id,
            store_id: store.id,
            subscription_id: subscription.id,
            plan_id: plan.id,
            gateway: "webxpay",
            order_reference: orderReference,
            amount: plan.price,
            currency: plan.currency,
            status: "pending",
        })
        .select()
        .single()

    if (paymentError) throw new Error(paymentError.message)

    const key = new NodeRSA(WEBXPAY_PUBLIC_KEY)

    const encryptedPayment = key.encrypt(
        `${orderReference}|${Number(plan.price).toFixed(2)}`,
        "base64"
    )

    return res.status(201).json({
        message: "Payment created successfully",
        data: {
            payment_id: paymentRow.id,
            checkout_url: WEBXPAY_CHECKOUT_URL,
            form: {
                first_name: store.name,
                last_name: "Customer",
                email: store.email || user.email,
                contact_number: store.phone_number || "",
                address_line_one: store.address || "",
                process_currency: plan.currency,
                secret_key: WEBXPAY_SECRET_KEY,
                custom_fields: "",
                payment: encryptedPayment,
            },
        },
    })
}