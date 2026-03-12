import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

export const supabaseClient = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey,
  {
    auth: {
      persistSession: false,
    },
  },
);
