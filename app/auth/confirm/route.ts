import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const email = searchParams.get("email"); // <-- 1. Extract email from search params
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");
  const redirectTo =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (error || errorCode || errorDescription) {
    const query = new URLSearchParams();
    if (error) query.set("error", error);
    if (errorCode) query.set("error_code", errorCode);
    if (errorDescription) query.set("error_description", errorDescription);
    redirect(`/auth/error?${query.toString()}`);
  }

  const supabase = await createClient();

  const code = searchParams.get("code");
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      redirect(redirectTo);
    }
    const query = new URLSearchParams({ error: exchangeError.message });
    if ("code" in exchangeError && exchangeError.code) {
      query.set("error_code", exchangeError.code);
    }
    redirect(`/auth/error?${query.toString()}`);
  }

  if (type && token_hash) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!otpError) {
      redirect(redirectTo);
    }
    const query = new URLSearchParams({ error: otpError.message });
    if ("code" in otpError && otpError.code) {
      query.set("error_code", otpError.code);
    }
    redirect(`/auth/error?${query.toString()}`);
  }

  if (type && token) {
    // 2. Ensure email exists when verifying a raw token
    if (!email) {
      redirect(`/auth/error?error=Email is required for token verification`);
    }

    const { error: otpError } = await supabase.auth.verifyOtp({
      type,
      token,
      email, // <-- 3. Pass the email into the VerifyOtp object
    });

    if (!otpError) {
      redirect(redirectTo);
    }
    const query = new URLSearchParams({ error: otpError.message });
    if ("code" in otpError && otpError.code) {
      query.set("error_code", otpError.code);
    }
    redirect(`/auth/error?${query.toString()}`);
  }

  redirect(`/auth/error?error=No token or type provided`);
}
