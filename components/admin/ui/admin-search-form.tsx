type Props = {
  q: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
};

export function AdminSearchForm({ q, placeholder, hidden = {} }: Props) {
  return (
    <form method="get" className="flex-1">
      {Object.entries(hidden).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null
      )}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
      />
    </form>
  );
}
