import { AdminCard } from "./admin-card";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export function AdminStatCard({ label, value, hint }: Props) {
  return (
    <AdminCard className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl font-semibold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </AdminCard>
  );
}
