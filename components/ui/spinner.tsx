import { Loader2 } from "lucide-react";

type Props = {
  className?: string;
};

export function Spinner({ className = "h-4 w-4" }: Props) {
  return (
    <Loader2
      className={`animate-spin ${className}`}
      aria-hidden
    />
  );
}
