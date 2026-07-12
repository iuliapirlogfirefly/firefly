import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";

export function BusinessHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-border bg-background px-4 lg:px-8">
      <Link
        href="/map"
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to app
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </header>
  );
}
