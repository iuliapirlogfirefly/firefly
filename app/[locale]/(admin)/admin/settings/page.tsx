import { AdminLaunchSettingsForm } from "@/components/admin/admin-launch-settings-form";
import { AdminLandingStatsForm } from "@/components/admin/admin-landing-stats-form";
import { getLaunchSettings } from "@/lib/launch/settings";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [settings, t] = await Promise.all([
    getLaunchSettings(),
    getTranslations("admin"),
  ]);

  return (
    <div data-route="admin-settings">
      <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Control the public countdown. Turn it on about a week before launch,
        then it disappears automatically at the end date.
      </p>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Pre-launch countdown
        </h2>
        <AdminLaunchSettingsForm
          key={`${settings.active}-${settings.endsAt?.toISOString() ?? "none"}`}
          initialActive={settings.active}
          initialEndsAt={settings.endsAt ? settings.endsAt.toISOString() : null}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          {t("landingStatsTitle")}
        </h2>
        <AdminLandingStatsForm
          key={String(settings.landingStatsEnabled)}
          initialEnabled={settings.landingStatsEnabled}
        />
      </div>
    </div>
  );
}
