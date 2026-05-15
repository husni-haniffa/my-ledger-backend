import { Request, Response } from "express"
import NodeRSA from "node-rsa"

import { supabaseAdmin } from "../../config/supabase"
import { BadRequestError } from "../../domain/errors/errors"

const WEBXPAY_PUBLIC_KEY = process.env.WEBXPAY_PUBLIC_KEY!

const FRONTEND_BILLING_SUCCESS_URL =
    process.env.FRONTEND_BILLING_SUCCESS_URL || "http://localhost:3000/billing/success"

const FRONTEND_BILLING_FAILED_URL =
    process.env.FRONTEND_BILLING_FAILED_URL || "http://localhost:3000/billing/failed"

type DecodedWebXPayResponse = {
    gatewayReference: string
    orderReferenceNumber: string
    transactionDate: string
    statusCode: string
    comment: string
    transactionId: string
    amount: number
    paidAmount: number
}

function verifyWebXPaySignature(payment: string, signature: string) {
    const paymentBuffer = Buffer.from(payment, "base64")
    const signatureBuffer = Buffer.from(signature, "base64")

    const key = new NodeRSA(WEBXPAY_PUBLIC_KEY)
    key.setOptions({ signingScheme: "pss-sha1" })

    return key.verify(paymentBuffer, signatureBuffer)
}

function decodeWebXPayPayment(payment: string): DecodedWebXPayResponse {
    const decoded = Buffer.from(payment, "base64").toString("utf8")

    const parts = decoded.split("|")

    if (parts.length < 8) {
        throw new BadRequestError("Invalid WebXPay payment response")
    }

    return {
        gatewayReference: parts[0],
        orderReferenceNumber: parts[1],
        transactionDate: parts[2],
        statusCode: parts[3],
        comment: parts[4],
        transactionId: parts[5],
        amount: Number(parts[6]),
        paidAmount: Number(parts[7]),
    }
}

export const webxpayResponse = async (req: Request, res: Response) => {
    const { payment, signature } = req.body

    if (!payment || !signature) {
        throw new BadRequestError("Missing WebXPay response")
    }

    const isValidSignature = verifyWebXPaySignature(payment, signature)

    if (!isValidSignature) {
        throw new BadRequestError("Invalid WebXPay signature")
    }

    const decoded = decodeWebXPayPayment(payment)
   

    const { data: existingPayment, error: paymentFetchError } =
        await supabaseAdmin
            .from("saas_payments")
            .select(`
        id,
        user_id,
        store_id,
        subscription_id,
        plan_id,
        order_reference,
        amount,
        currency,
        status,
        plans (
          billing_period
        )
      `)
            .eq("order_reference", decoded.gatewayReference)
            .maybeSingle()
        

    if (paymentFetchError) {
        throw new Error(paymentFetchError.message)
    }

    if (!existingPayment) {
        throw new BadRequestError("Payment record not found")
    }

    if (existingPayment.status === "paid") {
        return res.redirect(FRONTEND_BILLING_SUCCESS_URL)
    }

    const isApproved = ["0", "00"].includes(decoded.statusCode)

    if (!isApproved) {
        const { error: failedPaymentError } = await supabaseAdmin
            .from("saas_payments")
            .update({
                status: "failed",
                gateway_reference: decoded.orderReferenceNumber,
                raw_response: decoded,
            })
            .eq("id", existingPayment.id)

        if (failedPaymentError) {
            throw new Error(failedPaymentError.message)
        }

        return res.redirect(FRONTEND_BILLING_FAILED_URL)
    }

    const now = new Date()
    const currentPeriodEnd = new Date(now)
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    const { error: paidPaymentError } = await supabaseAdmin
        .from("saas_payments")
        .update({
            status: "paid",
            gateway_reference: decoded.gatewayReference,
            paid_at: now.toISOString(),
            raw_response: decoded,
        })
        .eq("id", existingPayment.id)

    if (paidPaymentError) {
        throw new Error(paidPaymentError.message)
    }

    const { error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .update({
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
        })
        .eq("id", existingPayment.subscription_id)

    if (subscriptionError) {
        throw new Error(subscriptionError.message)
    }

    const { error: storeError } = await supabaseAdmin
        .from("stores")
        .update({
            status: "active",
        })
        .eq("id", existingPayment.store_id)

    if (storeError) {
        throw new Error(storeError.message)
    }

    return res.redirect(FRONTEND_BILLING_SUCCESS_URL)
}