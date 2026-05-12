// src/routes/expense.routes.ts

import { Router } from "express"
import { createExpense } from "../application/expense/createExpense"
import { deleteExpense } from "../application/expense/deleteExpense"
import { getExpenseById } from "../application/expense/getExpenseById"
import { listExpenses } from "../application/expense/listExpense"
import { updateExpense } from "../application/expense/updateExpense"
import { requireAuthentication } from "../config/auth"


const expenseRouter = Router()

expenseRouter.get("/list", requireAuthentication, listExpenses)
expenseRouter.get("/get/:id", requireAuthentication, getExpenseById)
expenseRouter.post("/create", requireAuthentication, createExpense)
expenseRouter.patch("/update/:id", requireAuthentication, updateExpense)
expenseRouter.delete("/delete/:id", requireAuthentication, deleteExpense)

export default expenseRouter