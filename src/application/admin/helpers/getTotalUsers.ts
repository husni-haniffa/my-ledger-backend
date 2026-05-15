import { supabaseAdmin } from "../../../config/supabase"

export async function getTotalUsers() {
    const { count, error } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)

    if (error) throw new Error(error.message)

    return count || 0
}