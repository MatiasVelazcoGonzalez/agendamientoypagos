import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const publicEnv = getPublicEnv();
    _client = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return _client;
}

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
});