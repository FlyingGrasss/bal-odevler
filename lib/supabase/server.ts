import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase session configuration is missing.");

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Cookie stores cannot be mutated during rendering; sessions are
          // established in route handlers and server actions instead.
        }
      },
    },
  });
}
