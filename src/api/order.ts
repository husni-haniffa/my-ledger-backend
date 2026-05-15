// src/routes/order.routes.ts

import { Router } from "express"
import { createOrder } from "../application/order/createOrder"
import { deleteOrder } from "../application/order/deleteOrder"
import { getOrderById } from "../application/order/getOrderById"
import { listOrders } from "../application/order/listOrders"
import { updateOrder } from "../application/order/updateOrder"
import { updateOrderStatus } from "../application/order/updateOrderStatus"
import { requireAuthentication } from "../config/auth"
import { updateOrderPaymentStatus } from "../application/order/updateOrderPaymentStatus"
import { getOrderInvoice } from "../application/order/getOrderInvoice"


const orderRouter = Router()

orderRouter.get("/list", requireAuthentication, listOrders)
orderRouter.get("/get/:id", requireAuthentication, getOrderById)
orderRouter.post("/create", requireAuthentication, createOrder)
orderRouter.patch("/update/:id", requireAuthentication, updateOrder)
orderRouter.patch("/status/:id", requireAuthentication, updateOrderStatus)
orderRouter.delete("/delete/:id", requireAuthentication, deleteOrder)
orderRouter.patch("/payment-status/:id", requireAuthentication, updateOrderPaymentStatus)
orderRouter.get("/invoice/:id", requireAuthentication, getOrderInvoice)

export default orderRouter