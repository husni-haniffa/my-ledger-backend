import { Router } from "express"
import { requireAuthentication } from "../config/auth"
import { getCurrentPlan } from "../application/billing/getCurrentPlan"


const billingRouter = Router()

billingRouter.get("/current-plan", requireAuthentication, getCurrentPlan)

export default billingRouter