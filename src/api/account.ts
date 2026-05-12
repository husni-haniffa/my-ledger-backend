import { Router } from "express"
import { getAccountStatus } from "../application/account/getAccountStatus"
import { requireAuthentication } from "../config/auth"
import { createAccount } from "../application/account/createAccount"
import { updateAccount } from "../application/account/updateAccount"

const accountRouter = Router()

accountRouter.get("/status", requireAuthentication, getAccountStatus)
accountRouter.post("/create", requireAuthentication, createAccount)
accountRouter.patch("/update", requireAuthentication, updateAccount)

export default accountRouter