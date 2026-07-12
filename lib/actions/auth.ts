"use server";

import { redirect } from "next/navigation";
import { createAuthClient, createClient } from "@/lib/supabase/server";
import { createBusinessAccountForProfile } from "@/lib/actions/business";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { AccountType, ActionResult, BusinessType, UserRole } from "@/types";

function roleMatchesAccountType(
  role: UserRole,
  accountType: AccountType
): boolean {
  if (accountType === "person") return role === "user" || role === "admin";
  return role === "business_venue" || role === "business_organizer";
}

function accountTypeMismatchError(accountType: AccountType): string {
  if (accountType === "business") {
    return "This is a personal account. Switch to Person to sign in.";
  }
  return "This is a business account. Switch to Business to sign in.";
}

export async function signInWithEmail(
  email: string,
  password: string,
  accountType: AccountType,
  rememberMe = true
): Promise<ActionResult<{ redirectTo: string }>> {
  const disabled = supabaseDisabled<{ redirectTo: string }>();
  if (disabled) return disabled;

  const supabase = await createAuthClient({ rememberMe });
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return failure(error.message);

  const userId = authData.user?.id;
  if (!userId) return failure("Sign in failed");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", userId)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    return failure(profileError.message);
  }

  const role = (profile?.role as UserRole) ?? "user";

  if (!roleMatchesAccountType(role, accountType)) {
    await supabase.auth.signOut();
    return failure(accountTypeMismatchError(accountType));
  }

  let isSuspended = profile?.is_suspended === true;
  if (
    !isSuspended &&
    (role === "business_venue" || role === "business_organizer")
  ) {
    const { data: business } = await supabase
      .from("business_accounts")
      .select("status")
      .eq("profile_id", userId)
      .single();
    isSuspended = business?.status === "suspended";
  }

  if (isSuspended) {
    await supabase.auth.signOut();
    return failure("Account suspended");
  }

  return success({
    redirectTo: accountType === "business" ? "/business" : "/",
  });
}

type SignUpOptions = {
  displayName?: string;
  businessName?: string;
  businessType?: BusinessType;
};

export async function signUpWithEmail(
  email: string,
  password: string,
  accountType: AccountType,
  options: SignUpOptions = {}
): Promise<ActionResult<{ redirectTo: string }>> {
  const disabled = supabaseDisabled<{ redirectTo: string }>();
  if (disabled) return disabled;

  if (accountType === "business") {
    const businessName = options.businessName?.trim();
    if (!businessName || businessName.length < 2) {
      return failure("Business name must be at least 2 characters");
    }
    if (!options.businessType) {
      return failure("Business type is required");
    }
  }

  const supabase = await createClient();
  const displayName =
    accountType === "business"
      ? options.businessName?.trim()
      : options.displayName?.trim();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  });
  if (error) return failure(error.message);

  const userId = authData.user?.id;
  if (!userId) return failure("Sign up failed");

  if (accountType === "business") {
    const businessResult = await createBusinessAccountForProfile(
      supabase,
      userId,
      options.businessType!,
      options.businessName!.trim()
    );

    if (!businessResult.success) {
      return failure(businessResult.error);
    }

    return success({ redirectTo: "/business" });
  }

  return success({ redirectTo: "/" });
}

export async function signInWithOAuth(
  provider: "google" | "apple",
  locale: string
): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appUrl}/auth/callback?locale=${locale}`,
    },
  });

  if (error) return failure(error.message);
  if (!data.url) return failure("Failed to get OAuth URL");
  return success({ url: data.url });
}

export async function requestPasswordReset(
  email: string,
  locale: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?locale=${locale}&next=/auth/reset-password`,
  });

  if (error) return failure(error.message);
  return success(undefined);
}

export async function updatePassword(newPassword: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  if (newPassword.length < 6) {
    return failure("Password must be at least 6 characters");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return failure(error.message);
  return success(undefined);
}

export async function signOut(locale: string): Promise<void> {
  const disabled = supabaseDisabled();
  if (!disabled) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(`/${locale}/map`);
}

export async function updateProfile(data: {
  displayName?: string;
  preferredLocale?: "en" | "ro";
  newsletterOptIn?: boolean;
}): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return failure("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(data.displayName !== undefined && { display_name: data.displayName }),
      ...(data.preferredLocale !== undefined && {
        preferred_locale: data.preferredLocale,
      }),
      ...(data.newsletterOptIn !== undefined && {
        newsletter_opt_in: data.newsletterOptIn,
      }),
    })
    .eq("id", user.id);

  if (error) return failure(error.message);
  return success(undefined);
}
