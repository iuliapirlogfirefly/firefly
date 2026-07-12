type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl font-bold text-firefly">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-foreground/50">{hint}</div>
      ) : null}
    </div>
  );
}
