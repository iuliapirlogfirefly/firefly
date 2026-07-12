"use client";

import { useState, useTransition } from "react";
import {
  updateNearbyPreferences,
  type NearbyPreferences,
} from "@/lib/actions/profile";

type Props = {
  initial: NearbyPreferences | null;
};

const RADIUS_OPTIONS = [
  [2, "2 km"],
  [5, "5 km"],
  [10, "10 km"],
] as const;

function requestLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("denied")),
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  });
}

export function NearbyEventsSettings({ initial }: Props) {
  const [optIn, setOptIn] = useState(initial?.optIn ?? false);
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [radiusKm, setRadiusKm] = useState(initial?.radiusKm ?? 5);
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUseLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const coords = await requestLocation();
      setLat(coords.lat);
      setLng(coords.lng);
      setMessage("Location updated.");
    } catch {
      setError("Could not access your location. Check browser permissions.");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateNearbyPreferences({
        optIn,
        lat,
        lng,
        radiusKm,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage("Preferences saved.");
    });
  };

  return (
    <div className="mt-10 glass rounded-3xl p-6">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        ◦ Nearby events
      </div>
      <h2 className="font-heading text-2xl font-semibold">
        Daily digest near you
      </h2>
      <p className="mt-2 max-w-lg text-sm text-foreground/60">
        Get a daily email when new events are published within your chosen
        radius.
      </p>

      <label className="mt-6 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
          className="h-4 w-4 rounded border-firefly/30 accent-firefly"
        />
        <span className="text-sm">Email me about nearby events</span>
      </label>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-medium text-foreground/50">
          Radius
        </span>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRadiusKm(value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                radiusKm === value
                  ? "border-firefly bg-firefly text-primary-foreground"
                  : "border-firefly/20 text-foreground/70 hover:border-firefly/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locating}
          className="rounded-full border border-firefly/30 px-4 py-2 text-sm text-firefly hover:bg-firefly/10 disabled:opacity-50"
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
        {lat != null && lng != null ? (
          <span className="text-xs text-foreground/50">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-foreground/40">No location set</span>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mt-6 rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>

      {message ? (
        <p className="mt-3 text-sm text-firefly" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
