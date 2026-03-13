import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, getSupabaseServerEnv } from "@/lib/env";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const publicEnv = getPublicEnv();
    const serverEnv = getSupabaseServerEnv();
    _admin = createClient(
      publicEnv.supabaseUrl,
      serverEnv.serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return _admin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
});