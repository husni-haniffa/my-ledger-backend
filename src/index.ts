import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import { clerkMiddleware } from "@clerk/express"
import GlobalErrorHandler from "./domain/errors/global.error.handler"
import accountRouter from "./api/account"
import inventoryRouter from "./api/inventory"
import expenseRouter from "./api/expense"
import orderRouter from "./api/order"
import summaryRouter from "./api/summary"
import billingRouter from "./api/billing"

dotenv.config()

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: "Too many requests, please try again later.",
})

const PORT = process.env.PORT || 3001

const app = express()

app.use(helmet())
app.use(morgan("dev"))
app.use(clerkMiddleware())
app.use(express.urlencoded({ extended: true }))
app.use(
    cors({
        origin: [
            "https://my-ledger-frontend.vercel.app",
        ],
        credentials: true,
    })
)
app.use(limiter)
app.use(express.json())

app.get("/", (_req, res) => {
    res.send("MyLedger API Running")
})

app.use('/user/account', accountRouter)
app.use("/user/inventory", inventoryRouter)
app.use("/user/expense", expenseRouter)
app.use("/user/order", orderRouter)
app.use("/user/summary", summaryRouter)
app.use("/user/billing", billingRouter)
app.use(GlobalErrorHandler)


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})