export const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    encryptionKey: process.env.NEXT_PUBLIC_ENCRYPTION_KEY!,
    genaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    apifyApiKey: process.env.NEXT_PUBLIC_APIFY_API_KEY!,
    claudeApiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY!,
};