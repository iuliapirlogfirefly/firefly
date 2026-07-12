import { AdminUsersPage } from "@/components/admin/admin-users-page";
import { getAdminUsers } from "@/lib/queries/users";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminUsersRoutePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const users = await getAdminUsers();

  return <AdminUsersPage users={users} />;
}
