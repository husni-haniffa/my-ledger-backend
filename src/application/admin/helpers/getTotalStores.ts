import { supabaseAdmin } from "../../../config/supabase"

export async function getTotalStores() {
    const { count, error } = await supabaseAdmin
        .from("stores")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)

    if (error) throw new Error(error.message)

    return count || 0
}