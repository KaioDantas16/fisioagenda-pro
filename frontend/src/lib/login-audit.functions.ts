import { supabase } from "@/integrations/supabase/client";

// Direct client-side call (no SSR/server function).
// Inserts a row in `login_attempts` so we have a basic audit trail.
// Failure is non-fatal (best-effort fire-and-forget from auth.tsx).
export async function logLoginAttempt({
  data,
}: {
  data: { email: string; success: boolean };
}) {
  try {
    let ua: string | null = null;
    if (typeof navigator !== "undefined") ua = navigator.userAgent ?? null;
    await supabase.from("login_attempts").insert({
      email: data.email,
      ip_address: null,
      user_agent: ua,
      success: data.success,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
