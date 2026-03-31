import { config } from "./config";

// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
