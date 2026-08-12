type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-foreground/10 ${className}`}
      aria-hidden
    />
  );
}
