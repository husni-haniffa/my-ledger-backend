import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../../domain/errors/errors";
import { supabaseAdmin } from "../../config/supabase";
import { getUserStore } from "../../domain/helpers/getUserStore";

export const getCurrentPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = getAuth(req)

        if (!userId) {
            throw new UnauthorizedError("Unauthorized")
        }

        const store = await getUserStore(userId)

        const { data, error } = await supabaseAdmin
            .from("subscriptions")
            .select(`
        id,
        status,
        trial_start,
        trial_end,
        current_period_start,
        current_period_end,
        cancelled_at,
        plans (
          name,
          slug,
          price,
          currency,
          billing_period
        )
      `)
            .eq("store_id", store.id)
            .maybeSingle()

        if (error) {
            throw new Error(error.message)
        }

        if (!data) {
            return res.status(200).json({
                data: null,
            })
        }

        const now = new Date()
        const periodEnd = new Date(data.current_period_end)

        if (
            periodEnd < now &&
            (data.status === "trialing" || data.status === "active")
        ) {
            const { data: updatedSubscription, error: updateError } =
                await supabaseAdmin
                    .from("subscriptions")
                    .update({
                        status: "expired",
                    })
                    .eq("id", data.id)
                    .select(`
            id,
            status,
            trial_start,
            trial_end,
            current_period_start,
            current_period_end,
            cancelled_at,
            plans (
              name,
              slug,
              price,
              currency,
              billing_period
            )
          `)
                    .single()

            if (updateError) {
                throw new Error(updateError.message)
            }

            return res.status(200).json({
                data: updatedSubscription,
            })
        }

        return res.status(200).json({
            data,
        })
    } catch (error) {
        next(error)
    }
}