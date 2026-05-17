import { Request, Response, NextFunction} from "express"
import { supabaseAdmin } from "../../config/supabase"



export const getAdminPayments = async (req: Request, res: Response, next: NextFunction) => {
    

   try {
       const { data, error } = await supabaseAdmin
           .from("saas_payments")
           .select(`
      id,
      order_reference,
      gateway_reference,
      amount,
      currency,
      status,
      paid_at,
      created_at,
      raw_response,
      stores (
        id,
        name,
        email
      ),
      users (
        id,
        email,
        status
      ),
      plans (
        id,
        name,
        slug,
        price,
        currency,
        billing_period
      )
    `)
           .order("created_at", { ascending: false })

       if (error) {
           throw new Error(error.message)
       }

       return res.status(200).json({
           data: data || [],
       })
   } catch (error) {
    next(error)
   }
}