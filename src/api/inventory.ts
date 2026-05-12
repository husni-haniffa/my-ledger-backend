import { Router } from "express"
import { createInventory } from "../application/inventory/createInventory"
import { deleteInventory } from "../application/inventory/deleteInventory"
import { getInventoryById } from "../application/inventory/getInventoryById"
import { listInventory } from "../application/inventory/listInventory"
import { updateInventory } from "../application/inventory/updateInventory"
import { requireAuthentication } from "../config/auth"


const inventoryRouter = Router()

inventoryRouter.get("/list", requireAuthentication, listInventory)
inventoryRouter.get("/get/:id", requireAuthentication, getInventoryById)
inventoryRouter.post("/create", requireAuthentication, createInventory)
inventoryRouter.patch("/update/:id", requireAuthentication, updateInventory)
inventoryRouter.delete("/delete/:id", requireAuthentication, deleteInventory)

export default inventoryRouter