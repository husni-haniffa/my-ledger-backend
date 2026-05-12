import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { supabaseAdmin } from "../../config/supabase"
import { updateAccountSchema } from "../../domain/dtos/account"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../domain/errors/errors"


export const updateAccount = async (req: Request, res: Response) => {
    const { userId } = getAuth(req)

    if (!userId) {
        throw new UnauthorizedError('UnAuthorized')
    }

    const payload = updateAccountSchema.parse(req.body)

    const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", userId)
        .maybeSingle()

    if (userError) {
        throw new Error(userError.message)
    }

    if (!user) {
        throw new NotFoundError('User not found')
    }

    const storeUpdates: Record<string, unknown> = {}

    if (payload.store_name !== undefined) {
        storeUpdates.name = payload.store_name
    }

    if (payload.store_email !== undefined) {
        storeUpdates.email = payload.store_email || null
    }

    if (payload.store_phone_number !== undefined) {
        storeUpdates.phone_number = payload.store_phone_number || null
    }

    if (payload.store_address !== undefined) {
        storeUpdates.address = payload.store_address || null
    }

    if (Object.keys(storeUpdates).length === 0) {
        throw new BadRequestError('No feilds to updated')
    }

    const { data: store, error: storeError } = await supabaseAdmin
        .from("stores")
        .update(storeUpdates)
        .eq("user_id", user.id)
        .select(`
      id,
      name,
      email,
      phone_number,
      address,
      currency,
      timezone,
      status,
      updated_at
    `)
        .single()

    if (storeError) {
       throw new Error(storeError.message)
    }

    return res.status(200).json({
        message: "Account updated successfully",
        data: {
            store,
        },
    })
}