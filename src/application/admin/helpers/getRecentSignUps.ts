import { supabaseAdmin } from "../../../config/supabase"

export async function getRecentSignups() {
    const { data, error } = await supabaseAdmin
        .from("users")
        .select(`
      id,
      email,
      status,
      created_at,
      stores (
        id,
        name,
        status
      )
    `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)

    if (error) throw new Error(error.message)

    return data || []
}