import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ResetPasswordPage } from "@/components/auth/reset-password-page";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Set New Password",
    "Choose a new password for your Firefly account.",
    locale,
    "/auth/reset-password"
  );
}

export default async function ResetPasswordRoute({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { code, token_hash, type } = await searchParams;
  setRequestLocale(locale);

  if (token_hash && type) {
    redirect(
      `/auth/callback?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(type)}&locale=${locale}&next=/auth/reset-password`
    );
  }

  if (code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(code)}&locale=${locale}&next=/auth/reset-password`
    );
  }

  let authenticated = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authenticated = !!user;
  }

  return (
    <main data-route="auth-reset-password">
      <ResetPasswordPage authenticated={authenticated} />
    </main>
  );
}
