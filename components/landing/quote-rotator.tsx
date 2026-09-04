"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";

const INTERVAL_MS = 5000;
const FADE_MS = 400;

const quotes = [
  {
    text: "It's funny how the nights you never planned become the ones you never forget.",
    highlight: "forget",
    attribution: "Maria, catching the first morning tram.",
  },
  {
    text: "Nothing builds character like losing your friends in a club and pretending you're totally fine with it.",
    highlight: "fine",
    attribution: "Irina, 2:14 AM",
  },
  {
    text: "The afterparty always starts with someone saying 'I know a place.'",
    highlight: "place",
    attribution: "Alex, absolutely trusting that person",
  },
  {
    text: "You know it's a good night when the Uber driver asks if you're sure about the destination.",
    highlight: "destination",
    attribution: "Andreea, 4:52 AM",
  },
  {
    text: "I don't remember the DJ's name, but I'd recognize that set anywhere.",
    highlight: "anywhere",
    attribution: "Răzvan, still thinking about it Monday",
  },
  {
    text: "There's always one friend who knows a place that apparently doesn't exist on Google Maps.",
    highlight: "Maps",
    attribution: "Daria, following anyway",
  },
  {
    text: "The group chat spent 40 minutes choosing a place we stayed at for 23 minutes.",
    highlight: "minutes",
    attribution: "Andrei, Saturday night",
  },
  {
    text: "Nothing says 'quick drink' like checking the sunrise forecast.",
    highlight: "sunrise",
    attribution: "Bianca, 5:38 AM",
  },
  {
    text: "We skipped the first party because it looked too quiet. We were wrong.",
    highlight: "wrong",
    attribution: "Ștefan, learning the hard way",
  },
  {
    text: "I knew we were in trouble when someone said, 'Let's just check what's nearby.'",
    highlight: "nearby",
    attribution: "Elena, three venues later",
  },
  {
    text: "The best part of the night is finding a place none of you had heard of.",
    highlight: "heard",
    attribution: "Lavinia, gatekeeping the location",
  },
  {
    text: "There's a very specific moment when 'where are we going?' becomes 'where are we going next?'",
    highlight: "next",
    attribution: "David, 1:37 AM",
  },
  {
    text: "My screen time is embarrassing. My nightlife knowledge is impressive.",
    highlight: "impressive",
    attribution: "Daria, refusing to elaborate",
  },
  {
    text: "The party wasn't even on our list. That's usually how you know.",
    highlight: "know",
    attribution: "Mihai, 3:46 AM",
  },
  {
    text: "We said rooftop. We did not specify which rooftop.",
    highlight: "rooftop",
    attribution: "Alexandra, somewhere above Bucharest",
  },
  {
    text: "I only knew two people there. By 2 AM, apparently I knew everyone.",
    highlight: "everyone",
    attribution: "Ioana, making questionable new friends",
  },
] as const;

type QuoteItem = (typeof quotes)[number];

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
      const next = (current + 1) % quotes.length;
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
