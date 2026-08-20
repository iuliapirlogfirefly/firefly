import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Quote,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { FireflyField } from "@/components/FireflyField";
import { Nav } from "@/components/Nav";
import { landingImages } from "@/lib/landing/images";
import type { EventListItem } from "@/types/events";

type Props = {
  featured: EventListItem[];
};

const mapMarkers = [
  { top: "28%", left: "22%", size: 14 },
  { top: "44%", left: "55%", size: 24, promoted: true },
  { top: "62%", left: "38%", size: 12 },
  { top: "33%", left: "72%", size: 16 },
  { top: "70%", left: "66%", size: 14 },
  { top: "52%", left: "18%", size: 12 },
] as const;

const stats = [
  { n: "1,247", l: "parties this month" },
  { n: "84", l: "venues lit up" },
  { n: "12K", l: "nights planned" },
  { n: "·", l: "" },
  { n: "live", l: "every weekend", hand: true },
] as const;

const mapFeatures = [
  {
    icon: MapPin,
    t: "Real venues, real promoters",
    d: "Curated daily by people who actually go out.",
  },
  {
    icon: Sparkles,
    t: "Tonight glows brighter",
    d: "Events happening now pulse with urgency.",
  },
  {
    icon: Heart,
    t: "Save your jar of nights",
    d: "A private collection only you can see.",
  },
] as const;

const steps = [
  {
    n: "01",
    icon: MapPin,
    t: "The map glows",
    d: "Open Firefly and watch the city light up with everywhere worth being.",
    img: landingImages.stepMap,
    align: "left" as const,
  },
  {
    n: "02",
    icon: Sparkles,
    t: "An event appears",
    d: "Tap any firefly to peek at the lineup, venue, and the energy you're in for.",
    img: landingImages.editorialDj,
    align: "right" as const,
  },
  {
    n: "03",
    icon: Calendar,
    t: "You save the night",
    d: "Heart it, set a reminder, share with the right friends — the night is on your radar.",
    img: landingImages.stepSave,
    align: "left" as const,
  },
] as const;

export function HomePage({ featured }: Props) {
  return (
    <main data-route="landing" className="relative overflow-x-clip pb-24 md:pb-0">
      <Nav />

      <section className="relative min-h-[100vh] pt-24 pb-14 sm:pt-28 sm:pb-20">
        <FireflyField count={45} />
        <div
          className="pointer-events-none absolute -left-40 top-32 h-[520px] w-[520px] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(254,247,163,0.18) 0%, transparent 65%)",
          }}
        />

        <div className="relative mx-auto grid max-w-[1400px] items-center gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7">
            <div className="glass mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full px-3 py-1.5">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-firefly animate-firefly-pulse" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/80">
                Tonight in Bucharest · 23 venues glowing
              </span>
            </div>

            <h1
              className="font-display tracking-tight-logo animate-fade-up text-balance leading-[0.88]"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="block text-[14vw] sm:text-8xl md:text-[8.5rem]">
                Follow
              </span>
              <span className="-mt-2 block pl-[18%] text-[14vw] sm:-mt-3 sm:pl-[22%] sm:text-8xl md:text-[8.5rem]">
                the{" "}
                <span className="text-gradient-firefly text-glow italic">
                  light.
                </span>
              </span>
            </h1>

            <div
              className="mt-6 grid animate-fade-up grid-cols-12 items-start gap-4 sm:mt-10 sm:gap-6"
              style={{ animationDelay: "0.3s" }}
            >
              <p className="col-span-12 text-pretty text-base leading-relaxed text-foreground/70 sm:text-lg sm:col-span-7">
                The city&apos;s nightlife, mapped in real time. Every glowing dot
                is a party waiting to happen — open Firefly and let the night
                find you.
              </p>
              <div className="col-span-12 flex sm:col-span-5 sm:justify-end">
                <span className="font-hand -rotate-3 text-2xl leading-tight text-firefly/90 sm:text-3xl">
                  no group chats.
                  <br />
                  <span className="pl-4 sm:pl-6">just go.</span>
                </span>
              </div>
            </div>

            <div
              className="mt-6 flex flex-wrap animate-fade-up items-center gap-3 sm:mt-10 sm:gap-4"
              style={{ animationDelay: "0.5s" }}
            >
              <Link
                href="/map"
                className="group inline-flex items-center gap-2 rounded-full bg-firefly px-7 py-4 font-medium text-primary-foreground transition-all hover:scale-[1.03] hover:firefly-glow"
              >
                Open the map
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-full border border-firefly/40 px-7 py-4 font-medium text-firefly transition-colors hover:bg-firefly/10"
              >
                Browse tonight
              </Link>
            </div>
          </div>

          <div
            className="relative h-[340px] animate-fade-up sm:h-[460px] md:h-[560px] lg:col-span-5"
            style={{ animationDelay: "0.4s" }}
          >
            <div
              className="absolute right-0 top-0 h-[78%] w-[78%] overflow-hidden rounded-2xl border border-firefly/15"
              style={{
                transform: "rotate(2deg)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
              }}
            >
              <Image
                src={landingImages.heroCrowd}
                alt="DJ booth and crowd in a Bucharest club"
                fill
                priority
                sizes="(max-width: 1024px) 80vw, 35vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>

            <div
              className="polaroid absolute bottom-0 left-0 w-[58%] rounded-sm"
              style={{ transform: "rotate(-5deg)" }}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={landingImages.heroFrame}
                  alt="Friends dancing at a night out"
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <div className="tape absolute -top-3 left-1/2 h-5 w-20 -translate-x-1/2 rounded-sm" />
              <div className="mt-2 text-center font-hand text-lg leading-none text-primary-foreground sm:mt-3 sm:text-2xl">
                saturday · 02:14am
              </div>
            </div>

            <div
              className="glass absolute -left-2 top-[10%] hidden rounded-xl px-3 py-2 sm:block"
              style={{ transform: "rotate(-8deg)" }}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
                live
              </div>
              <div className="mt-0.5 font-heading text-sm">Subterra · 23:00</div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-6">
          <div className="deco-line mb-6" />
          <div className="flex flex-wrap items-baseline gap-x-12 gap-y-4">
            {stats.map((s, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span
                  className={
                    "hand" in s && s.hand
                      ? "font-hand text-3xl italic text-firefly"
                      : "font-heading text-2xl text-firefly md:text-3xl"
                  }
                >
                  {s.n}
                </span>
                {s.l ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50">
                    {s.l}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-firefly/10 bg-surface-1/40 py-10">
        <div
          className="flex animate-marquee-scroll gap-12 whitespace-nowrap font-display text-3xl text-foreground/30 md:text-5xl"
        >
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 gap-12">
              <span>techno</span>
              <span className="text-firefly/60">·</span>
              <span className="italic">disco edits</span>
              <span className="text-firefly/60">·</span>
              <span>warehouse</span>
              <span className="text-firefly/60">·</span>
              <span className="italic text-firefly/80">after hours</span>
              <span className="text-firefly/60">·</span>
              <span>jazz cellar</span>
              <span className="text-firefly/60">·</span>
              <span className="italic">rooftop</span>
              <span className="text-firefly/60">·</span>
              <span>secret set</span>
              <span className="text-firefly/60">·</span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative py-28 md:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:pt-16">
            <div className="mb-5 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              ◦ Chapter 01 — The Living Map
            </div>
            <h2 className="text-balance font-heading text-5xl font-bold leading-[1.02] md:text-6xl">
              The city breathes.
              <br />
              You just{" "}
              <em className="font-display not-italic text-gradient-firefly">
                listen
              </em>
              .
            </h2>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-foreground/70">
              Pan across Bucharest and watch fireflies appear — each one a real
              event, pulsing faster the closer it gets to doors open.
            </p>

            <div className="mt-10 space-y-5">
              {mapFeatures.map((f, i) => (
                <div
                  key={f.t}
                  className="group flex gap-4"
                  style={{ transform: `translateX(${i * 8}px)` }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-firefly/30 bg-firefly/10 transition-all group-hover:firefly-glow">
                    <f.icon className="h-4 w-4 text-firefly" />
                  </div>
                  <div className="pt-1">
                    <div className="font-heading font-semibold">{f.t}</div>
                    <div className="mt-1 text-sm text-foreground/60">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-7">
            <div
              className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-firefly/10"
              style={{
                boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
                transform: "rotate(-1deg)",
              }}
            >
              <Image
                src={landingImages.mapPreview}
                alt="Nightlife map"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/20 to-transparent" />

              {mapMarkers.map((m, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{ top: m.top, left: m.left }}
                >
                  <div
                    className="relative animate-firefly-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: m.size,
                        height: m.size,
                        background:
                          "promoted" in m && m.promoted
                            ? "radial-gradient(circle, #FEF7A3 0%, #E89A5F 100%)"
                            : "#FEF7A3",
                        boxShadow: `0 0 ${m.size * 2}px #FEF7A3, 0 0 ${m.size * 5}px rgba(254,247,163,0.6)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="glass absolute -bottom-8 -left-4 max-w-xs rounded-2xl p-5 sm:left-10"
              style={{
                transform: "rotate(2deg)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-firefly animate-firefly-pulse" />
                </span>
                <div className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
                  Tonight · 23:00 · Open now
                </div>
              </div>
              <div className="mt-2 font-heading text-xl leading-tight">
                Subterra: All Night Long
              </div>
              <div className="mt-1 text-xs text-foreground/60">
                Control Club · Techno
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-amber-warm/15 px-2 py-0.5 text-[10px] font-medium text-amber-warm">
                  From 35 lei
                </span>
                <span className="font-hand text-base text-firefly">tap me →</span>
              </div>
            </div>

            <div
              className="absolute -right-4 -top-10 hidden w-44 overflow-hidden rounded-xl border border-firefly/15 md:block"
              style={{
                transform: "rotate(6deg)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <Image
                src={landingImages.mapInset}
                alt="Martini Club cocktail"
                width={176}
                height={235}
                className="aspect-[3/4] h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-12 grid items-end gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
                ◦ Chapter 02 — This week
              </div>
              <h2 className="text-balance font-heading text-5xl font-bold leading-[0.98] md:text-7xl">
                The parties everyone&apos;s
                <span className="font-display italic text-gradient-firefly">
                  {" "}
                  whispering{" "}
                </span>
                about.
              </h2>
            </div>
            <div className="flex lg:col-span-5 lg:justify-end">
              <Link
                href="/feed"
                className="group inline-flex items-center gap-2 font-medium text-firefly transition-all hover:gap-3"
              >
                <span className="font-hand text-2xl">see them all</span>
                <ArrowRight className="mt-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
            {featured[0] ? (
              <div className="md:col-span-7 md:row-span-2">
                <div className="h-full md:-rotate-[0.6deg]">
                  <EventCard event={featured[0]} featured />
                </div>
              </div>
            ) : null}
            {featured.slice(1, 3).map((event, i) => (
              <div
                key={event.id}
                className={`md:col-span-5${i === 1 ? " md:translate-y-6" : ""}`}
              >
                <EventCard event={event} />
              </div>
            ))}
            {featured.slice(3, 5).map((event, i) => (
              <div
                key={event.id}
                className={`md:col-span-6${i === 1 ? " md:translate-y-4" : ""}`}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div
            className="relative aspect-[16/8] overflow-hidden rounded-3xl border border-firefly/10"
            style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
          >
            <Image
              src={landingImages.editorialStreet}
              alt="Bucharest nightlife through a rain-speckled window"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
            <FireflyField count={15} />

            <div className="relative flex h-full items-center px-8 md:px-16">
              <div className="max-w-xl">
                <Quote className="-scale-x-100 mb-4 h-8 w-8 text-firefly/80" />
                <p className="text-balance font-display text-3xl leading-[1.05] md:text-5xl">
                  &ldquo;It&apos;s funny how the nights you never planned become
                  the ones you never{" "}
                  <span className="text-gradient-firefly">forget</span>.&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px w-12 bg-firefly/60" />
                  <span className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/60">
                    Maria, catching the first morning tram.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-32">
        <FireflyField count={18} />
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="mb-20 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
                ◦ Chapter 03 — How it works
              </div>
              <h2 className="font-heading text-5xl font-bold leading-[1.02] md:text-6xl">
                Three steps from{" "}
                <em className="font-display not-italic text-gradient-firefly">
                  curiosity
                </em>{" "}
                to dance floor.
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:pt-8">
              <p className="text-pretty text-foreground/65">
                No accounts required to look. No paywalls to peek. Save what you
                love when you&apos;re ready — everything else is the city, freely
                on display.
              </p>
            </div>
          </div>

          <div className="space-y-16 md:space-y-8">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="grid items-center gap-6 md:grid-cols-12"
              >
                <div
                  className={`md:col-span-5 md:row-start-1 ${
                    step.align === "right" ? "md:col-start-8" : ""
                  }`}
                >
                  <div
                    className="relative overflow-hidden rounded-2xl border border-firefly/15"
                    style={{
                      transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                    }}
                  >
                    <Image
                      src={step.img}
                      alt=""
                      width={640}
                      height={480}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                </div>
                <div
                  className={`md:col-span-6 md:row-start-1 ${
                    step.align === "left" ? "md:col-start-7" : "md:col-start-1"
                  }`}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-6xl text-firefly/30">
                      {step.n}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-firefly/30 bg-firefly/10">
                      <step.icon className="h-4 w-4 text-firefly" />
                    </div>
                  </div>
                  <h3 className="mt-4 font-heading text-3xl font-bold md:text-4xl">
                    {step.t}
                  </h3>
                  <p className="mt-3 max-w-md leading-relaxed text-foreground/65">
                    {step.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <div
              className="relative overflow-hidden rounded-2xl border border-firefly/15"
              style={{
                transform: "rotate(-2deg)",
                boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
              }}
            >
              <Image
                src={landingImages.manifestoDj}
                alt="DJ hands on a mixer"
                width={640}
                height={800}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <span className="absolute -bottom-4 -right-2 rotate-[-6deg] font-hand text-3xl text-firefly">
              recorded sunday, 4am
            </span>
          </div>
          <div className="lg:col-span-7 lg:pl-8">
            <div className="mb-4 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              ◦ A small manifesto
            </div>
            <p className="text-balance font-heading text-3xl leading-[1.15] md:text-4xl">
              We don&apos;t believe nightlife belongs in a feed of{" "}
              <span className="text-foreground/30 line-through">
                algorithmic suggestions
              </span>
              . It belongs in{" "}
              <span className="text-gradient-firefly">people&apos;s hands</span>
              , in the city, in the moment a friend says
              <em className="font-display not-italic">
                {" "}
                &ldquo;wait, where are we going?&rdquo;
              </em>
            </p>
            <p className="mt-6 max-w-xl text-pretty text-foreground/65">
              Firefly is built by people who would rather be at the party than
              building the app — which is exactly why we built it.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-32">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(254,247,163,0.15) 0%, transparent 60%)",
          }}
        />
        <FireflyField count={35} />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block rotate-[-2deg] font-hand text-3xl text-firefly">
            it&apos;s already happening.
          </span>
          <h2 className="text-balance font-display text-6xl leading-[0.95] md:text-8xl">
            The night is <br />
            <span className="text-gradient-firefly text-glow italic">
              already glowing.
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-lg text-foreground/70">
            Stop scrolling group chats. Open the map. Find the spark. Go.
          </p>
          <Link
            href="/map"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-firefly px-9 py-5 text-lg font-medium text-primary-foreground transition-all hover:scale-[1.03] hover:firefly-glow"
          >
            Follow the light
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
