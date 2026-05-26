import { createClient as createSupabase } from "@supabase/supabase-js";
import type { ProfileDTO } from "@/lib/dto/profile";

/** Anonymous Supabase client for public (unauthenticated) reads. */
export function createAnonClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/** Build the contacts rows to insert from a ProfileDTO. */
export function buildContacts(
  userId: string,
  body: ProfileDTO,
): { profile: string; contact_type: string; contact: string }[] {
  const result: { profile: string; contact_type: string; contact: string }[] =
    [];
  if (body.linkedin) {
    result.push({
      profile: userId,
      contact_type: "LinkedIn",
      contact: body.linkedin,
    });
  }
  if (body.github) {
    result.push({
      profile: userId,
      contact_type: "GitHub",
      contact: body.github,
    });
  }
  return result;
}
