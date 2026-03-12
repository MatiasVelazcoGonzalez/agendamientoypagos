import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

const publicEnv = getPublicEnv();

export const supabaseClient = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey,
  {
    auth: {
      persistSession: false,
    },
  },
);
