import { setRequestLocale } from "next-intl/server";
import { ForgotPasswordPage } from "@/components/auth/forgot-password-page";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Reset Password",
    "Request a password reset link for your Firefly account.",
    locale,
    "/auth/forgot-password"
  );
}

export default async function ForgotPasswordRoute({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);

  return (
    <main data-route="auth-forgot-password">
      <ForgotPasswordPage
        locale={locale}
        linkError={error === "invalid_link"}
      />
    </main>
  );
}
