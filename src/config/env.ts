import dotenv from "dotenv"

dotenv.config()

export const env = {
    PORT: process.env.PORT || "5000",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

if (!env.PORT) {
    throw new Error("PORT is missing")
}

if (!env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is missing")
}

if (!env.CLERK_PUBLISHABLE_KEY) {
    throw new Error("CLERK_PUBLISHABLE_KEY is missing")
}

if (!env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is missing")
}

if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing")
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing")
}