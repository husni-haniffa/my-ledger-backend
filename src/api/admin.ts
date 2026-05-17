import { Router } from "express"
import { requireAuthentication } from "../config/auth"
import { getAdminDashboard } from "../application/admin/getAdminDashboard"
import {getAdminUsers } from "../application/admin/getUsers"
import { getAdminPayments } from "../application/admin/getPayments"
import { getAdminAnalytics } from "../application/admin/getAdminAnalytics"


const adminRouter = Router()

adminRouter.get("/summary", requireAuthentication, getAdminDashboard)
adminRouter.get("/users", requireAuthentication, getAdminUsers)
adminRouter.get("/payments", requireAuthentication, getAdminPayments)
adminRouter.get("/analytics", requireAuthentication, getAdminAnalytics)

export default adminRouter