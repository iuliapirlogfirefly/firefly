import { Link } from "@/i18n/navigation";
import { formatDelta } from "@/lib/utils/percent-change";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number | null;
  onClick?: () => void;
  active?: boolean;
};

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  const text = formatDelta(delta);
  if (!text || delta == null) return null;
  const color =
    delta > 0
      ? "text-emerald-500"
      : delta < 0
        ? "text-red-500"
        : "text-foreground/50";
  return <div className={`mt-1 text-xs font-medium ${color}`}>{text} MoM</div>;
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  onClick,
  active,
}: Props) {
  const className = `glass rounded-2xl p-5 text-left ${
    onClick
      ? `cursor-pointer transition-colors hover:bg-firefly/5 ${
          active ? "ring-1 ring-firefly/40" : ""
        }`
      : ""
  }`;

  const content = (
    <>
      <div className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl font-bold text-firefly">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <DeltaBadge delta={delta} />
      {hint ? (
        <div className="mt-1 text-xs text-foreground/50">{hint}</div>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function StatCardLink({
  href,
  ...props
}: Omit<Props, "onClick" | "active"> & { href: string }) {
  return (
    <Link href={href}>
      <StatCard {...props} />
    </Link>
  );
}
