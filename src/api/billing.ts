import { Router } from "express"
import { requireAuthentication } from "../config/auth"
import { getCurrentPlan } from "../application/billing/getCurrentPlan"
import { createPayment } from "../application/billing/createPayment"
import { webxpayResponse } from "../application/billing/webXPayResponse"


const billingRouter = Router()

billingRouter.get("/current-plan", requireAuthentication, getCurrentPlan)
billingRouter.post("/create-payment", createPayment)
billingRouter.post("/webxpay/response", webxpayResponse)

export default billingRouter