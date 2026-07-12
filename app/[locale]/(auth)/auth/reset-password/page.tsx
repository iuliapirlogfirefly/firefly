import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ResetPasswordPage } from "@/components/auth/reset-password-page";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{ code?: string }>;
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
  const { code } = await searchParams;
  setRequestLocale(locale);

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
