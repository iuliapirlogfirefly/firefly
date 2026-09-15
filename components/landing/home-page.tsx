import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { FireflyField } from "@/components/FireflyField";
import { Nav } from "@/components/Nav";
import { PrelaunchLanding } from "@/components/landing/prelaunch-landing";
import { HeroPin } from "@/components/landing/hero-pin";
import { QuoteRotator } from "@/components/landing/quote-rotator";
import { landingImages } from "@/lib/landing/images";
import { isPrelaunchActive } from "@/lib/launch/settings";

const stats = [
  { n: "1,247", l: "parties this month" },
  { n: "84", l: "venues lit up" },
  { n: "12K", l: "nights planned" },
  { n: "·", l: "" },
  { n: "live", l: "every weekend", hand: true },
] as const;

const mapFeatureIcons = [MapPin, Sparkles, Heart] as const;
const mapFeatureKeys = ["pin1", "pin2", "pin3"] as const;

const marqueeItems = [
  "Party",
  "Concert",
  "Festival",
  "Rooftop",
  "Brunch / Day Party",
  "Social Gathering",
  "Club Night",
  "Live Performance",
  "Private Event",
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

export async function HomePage() {
  if (await isPrelaunchActive()) {
    return <PrelaunchLanding />;
  }

  const t = await getTranslations("landing");
  const mapFeatures = mapFeatureKeys.map((key, i) => ({
    icon: mapFeatureIcons[i],
    t: t(`${key}Title`),
    d: t(`${key}Description`),
  }));

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
              className="font-heading font-bold tracking-tight-logo animate-fade-up text-balance leading-[0.88]"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="block text-[14vw] sm:text-8xl md:text-[8.5rem]">
                Follow
              </span>
              <span className="-mt-2 block pl-[18%] text-[14vw] sm:-mt-3 sm:pl-[22%] sm:text-8xl md:text-[8.5rem]">
                the{" "}
                <span className="bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow italic">
                  light.
                </span>
              </span>
            </h1>

            <p
              className="mt-6 max-w-xl animate-fade-up text-pretty text-base leading-relaxed text-foreground/70 sm:mt-10 sm:text-lg"
              style={{ animationDelay: "0.3s" }}
            >
              The city&apos;s nightlife, mapped in real time. Every glowing dot
              is a party waiting to happen.
            </p>

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
            className="relative hidden h-[560px] animate-fade-up items-center justify-center lg:col-span-5 lg:flex"
            style={{ animationDelay: "0.4s" }}
          >
            <HeroPin className="h-[78%]" />
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
        <div className="flex animate-marquee-scroll gap-12 whitespace-nowrap font-heading text-3xl font-bold tracking-tight-logo md:text-5xl">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 items-baseline gap-12">
              {marqueeItems.map((label, i) => (
                <span key={`${k}-${label}`} className="flex items-baseline gap-12">
                  <span
                    className={
                      i % 2 === 1
                        ? "bg-gradient-to-r from-white to-firefly bg-clip-text italic text-transparent text-glow"
                        : undefined
                    }
                  >
                    {label}
                  </span>
                  <span className="text-firefly/60">·</span>
                </span>
              ))}
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
              {t.rich("chapter01Headline", {
                glow: (chunks) => (
                  <em className="font-display not-italic bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow">
                    {chunks}
                  </em>
                ),
              })}
            </h2>

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

          <div className="relative flex items-center justify-center lg:col-span-7">
            <div
              className="w-full max-w-sm overflow-hidden rounded-xl border border-firefly/15 sm:max-w-md"
              style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
            >
              <Image
                src={landingImages.mapInset}
                alt="Martini Club cocktail"
                width={480}
                height={640}
                className="aspect-[3/4] h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-32">
        <FireflyField count={18} />
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="mb-20">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              ◦ Chapter 02 — How it works
            </div>
            <h2 className="max-w-3xl font-heading text-5xl font-bold leading-[1.02] md:text-6xl">
              Three steps from{" "}
              <em className="font-display not-italic bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow">
                curiosity
              </em>{" "}
              to dance floor.
            </h2>
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

      <section className="relative py-10 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div
            className="relative aspect-[4/3] w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-firefly/10 sm:aspect-[16/8]"
            style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
          >
            <Image
              src={landingImages.editorialStreet}
              alt="Bucharest nightlife through a rain-speckled window"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-background/20 sm:via-background/40 sm:to-transparent" />
            <FireflyField count={15} />

            <div className="absolute inset-0 flex items-center px-5 py-6 sm:px-8 md:px-16">
              <QuoteRotator />
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid items-end gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
                ◦ Chapter 03 — This week
              </div>
              <h2 className="text-balance font-heading text-5xl font-bold leading-[0.98] md:text-7xl">
                The parties everyone&apos;s
                <span className="font-display italic bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow">
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
              <span className="bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent">
                people&apos;s hands
              </span>
              , in the city, in the moment a friend says
              <em className="font-display not-italic">
                {" "}
                &ldquo;wait, where are we going?&rdquo;
              </em>
            </p>
            <p className="mt-6 max-w-xl text-pretty text-foreground/65">
              Firefly was built by people who&apos;d rather be at the party than
              looking for one.
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
          <h2 className="mx-auto w-fit text-left font-heading font-bold tracking-tight-logo leading-[0.88]">
            <span className="block text-[14vw] sm:text-8xl md:text-[8.5rem]">
              Your night
            </span>
            <span className="-mt-2 block pl-[18%] text-[14vw] sm:-mt-3 sm:pl-[22%] sm:text-8xl md:text-[8.5rem]">
              is out{" "}
              <span className="bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow italic">
                there.
              </span>
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-lg text-foreground/70">
            Find it.
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
