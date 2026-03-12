import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

const publicEnv = getPublicEnv();
const serverEnv = getServerEnv();

export const supabaseAdmin = createClient(
  publicEnv.supabaseUrl,
  serverEnv.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
