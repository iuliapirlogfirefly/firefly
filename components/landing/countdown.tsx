"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { remainingUntil } from "@/lib/launch/config";

type Remaining = ReturnType<typeof remainingUntil>;

type Props = {
  launchAtIso: string;
  initialRemaining: Remaining;
  launchesOnLabel: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function Countdown({
  launchAtIso,
  initialRemaining,
  launchesOnLabel,
}: Props) {
  const t = useTranslations("prelaunch");
  const router = useRouter();
  const [parts, setParts] = useState(initialRemaining);
  const sawLiveTick = useRef(!initialRemaining.done);
  const refreshed = useRef(false);

  useEffect(() => {
    const target = new Date(launchAtIso);
    if (Number.isNaN(target.getTime())) return;

    const tick = () => {
      const next = remainingUntil(target);
      if (!next.done) sawLiveTick.current = true;
      setParts(next);
      if (next.done && sawLiveTick.current && !refreshed.current) {
        refreshed.current = true;
        router.refresh();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [launchAtIso, router]);

  const units = [
    { key: "days", value: parts.days, label: t("days") },
    { key: "hours", value: parts.hours, label: t("hours") },
    { key: "minutes", value: parts.minutes, label: t("minutes") },
    { key: "seconds", value: parts.seconds, label: t("seconds") },
  ] as const;

  return (
    <div>
      <p className="sr-only">{launchesOnLabel}</p>
      <div
        aria-hidden="true"
        className="grid grid-cols-4 gap-2 sm:gap-3"
      >
        {units.map((unit) => (
          <div
            key={unit.key}
            className="glass flex flex-col items-center rounded-2xl px-2 py-3 sm:px-3 sm:py-4"
            style={{
              boxShadow: "0 0 40px rgba(254, 247, 163, 0.06)",
            }}
          >
            <span className="font-heading text-2xl font-bold tabular-nums text-firefly sm:text-4xl md:text-5xl">
              {pad(unit.value)}
            </span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-wider-2 text-foreground/50 sm:text-[10px]">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
