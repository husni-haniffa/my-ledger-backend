import { Router } from "express"
import { getSummary } from "../application/report/summary"
import { requireAuthentication, requireAuthorization } from "../config/auth"



const summaryRouter = Router()

summaryRouter.get("/", getSummary)

export default summaryRouter