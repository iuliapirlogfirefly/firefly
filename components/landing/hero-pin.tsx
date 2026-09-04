type HeroPinProps = {
  className?: string;
};

const PIN_PATH =
  "M32 4c15.464 0 28 12.536 28 28 0 19.5-28 52-28 52S4 51.5 4 32C4 16.536 16.536 4 32 4ZM32 20c6.627 0 12 5.373 12 12s-5.373 12-12 12-12-5.373-12-12 5.373-12 12-12z";

export function HeroPin({ className }: HeroPinProps) {
  return (
    <div
      aria-hidden
      className={`relative aspect-[64/88] ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 64 88"
        className="pointer-events-none absolute inset-0 h-full w-full animate-firefly-pulse text-firefly blur-2xl"
      >
        <path fill="currentColor" fillRule="evenodd" d={PIN_PATH} />
      </svg>
      <svg
        viewBox="0 0 64 88"
        className="relative h-full w-full overflow-visible text-firefly"
        style={{
          filter:
            "drop-shadow(0 0 16px oklch(0.96 0.085 100 / 0.75)) drop-shadow(0 0 40px oklch(0.96 0.085 100 / 0.4)) drop-shadow(0 0 80px oklch(0.96 0.085 100 / 0.18))",
        }}
      >
        <path fill="currentColor" fillRule="evenodd" d={PIN_PATH} />
      </svg>
    </div>
  );
}
