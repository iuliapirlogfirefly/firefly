"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { useTranslations } from "next-intl";

const INTERVAL_MS = 5000;
const FADE_MS = 400;
const QUOTE_COUNT = 16;

type QuoteItem = {
  text: string;
  highlight: string;
  attribution: string;
};

function QuoteText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  const start = text.lastIndexOf(highlight);
  if (start === -1) return text;

  return (
    <>
      {text.slice(0, start)}
      <span className="text-gradient-firefly">{highlight}</span>
      {text.slice(start + highlight.length)}
    </>
  );
}

function QuoteBody({ quote }: { quote: QuoteItem }) {
  return (
    <>
      <p className="font-display text-[1.35rem] leading-snug sm:text-balance sm:text-3xl sm:leading-[1.05] md:text-5xl">
        &ldquo;
        <QuoteText text={quote.text} highlight={quote.highlight} />
        &rdquo;
      </p>
      <div className="mt-4 flex items-start gap-3 sm:mt-6">
        <div className="mt-[0.7em] h-px w-8 shrink-0 bg-firefly/60 sm:w-12" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-foreground/60 sm:tracking-wider-2">
          {quote.attribution}
        </span>
      </div>
    </>
  );
}

export function QuoteRotator() {
  const t = useTranslations("landing");
  const quotes: QuoteItem[] = Array.from({ length: QUOTE_COUNT }, (_, i) => {
    const n = i + 1;
    return {
      text: t(`quotes.q${n}.text`),
      highlight: t(`quotes.q${n}.highlight`),
      attribution: t(`quotes.q${n}.attribution`),
    };
  });

  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fadeTimeout = 0;
    let raf = 0;

    const interval = window.setInterval(() => {
      const current = indexRef.current;
      const next = (current + 1) % QUOTE_COUNT;
      indexRef.current = next;

      if (media.matches) {
        setPrevIndex(null);
        setIncomingVisible(true);
        setIndex(next);
        return;
      }

      setPrevIndex(current);
      setIncomingVisible(false);
      setIndex(next);

      raf = window.requestAnimationFrame(() => {
        raf = window.requestAnimationFrame(() => {
          setIncomingVisible(true);
        });
      });

      fadeTimeout = window.setTimeout(() => {
        setPrevIndex(null);
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fadeTimeout);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const quote = quotes[index];
  const outgoing = prevIndex === null ? null : quotes[prevIndex];

  return (
    <div className="w-full max-w-xl">
      <Quote className="-scale-x-100 mb-3 h-6 w-6 text-firefly/80 sm:mb-4 sm:h-8 sm:w-8" />
      <div className="relative">
        <div className="invisible" aria-hidden>
          <QuoteBody quote={quote} />
        </div>
        {outgoing ? (
          <div
            className="absolute inset-x-0 top-0 transition-opacity ease-in-out motion-reduce:transition-none"
            style={{
              opacity: incomingVisible ? 0 : 1,
              transitionDuration: `${FADE_MS}ms`,
            }}
            aria-hidden
          >
            <QuoteBody quote={outgoing} />
          </div>
        ) : null}
        <div
          className="absolute inset-x-0 top-0 transition-opacity ease-in-out motion-reduce:transition-none"
          style={{
            opacity: incomingVisible ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          <QuoteBody quote={quote} />
        </div>
      </div>
    </div>
  );
}
