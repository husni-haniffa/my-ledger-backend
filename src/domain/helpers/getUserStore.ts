import { supabaseAdmin } from "../../config/supabase"

export async function getUserStore(clerkUserId: string) {
    const { data: user, error } = await supabaseAdmin
        .from("users")
        .select(`
      id,
      stores (
        id,
        status
      )
    `)
        .eq("clerk_user_id", clerkUserId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    const store = Array.isArray(user?.stores) ? user?.stores[0] : user?.stores

    if (!user || !store) {
        throw new Error("Store not found")
    }

    if (store.status !== "active") {
        throw new Error("Store is not active")
    }

    return store
}