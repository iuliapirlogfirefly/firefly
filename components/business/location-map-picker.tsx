"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  reverseGeocodeAction,
  searchAddressAction,
} from "@/lib/actions/geocode";
import {
  BUCHAREST_CENTER,
  MAP_STYLE_URL,
} from "@/lib/utils/map-coords";

type Props = {
  address: string;
  onAddressChange: (address: string) => void;
  lat: number;
  lng: number;
  onCoordsChange: (lat: number, lng: number) => void;
  disabled?: boolean;
  inputClassName?: string;
  labelClassName?: string;
};

function createPinElement(): HTMLElement {
  const el = document.createElement("div");
  el.className =
    "h-4 w-4 rounded-full border-2 border-primary-foreground bg-firefly shadow-[0_0_12px_rgba(255,184,0,0.55)]";
  el.style.cursor = "grab";
  return el;
}

export function LocationMapPicker({
  address,
  onAddressChange,
  lat,
  lng,
  onCoordsChange,
  disabled = false,
  inputClassName = "",
  labelClassName = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const skipReverseRef = useRef(false);
  const lastResolvedAddressRef = useRef(address.trim());
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const syncMarker = useEffectEvent((nextLat: number, nextLng: number) => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([nextLng, nextLat]);
    map.easeTo({ center: [nextLng, nextLat], duration: 400 });
  });

  const handlePinMove = useEffectEvent(async (nextLat: number, nextLng: number) => {
    onCoordsChange(nextLat, nextLng);

    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }

    const displayName = await reverseGeocodeAction(nextLat, nextLng);
    if (displayName) {
      lastResolvedAddressRef.current = displayName.trim();
      onAddressChange(displayName);
    }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE_URL,
      center: [lng, lat],
      zoom: 13,
      attributionControl: { compact: true },
      interactive: !disabled,
    });

    const marker = new maplibregl.Marker({
      element: createPinElement(),
      draggable: !disabled,
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on("dragend", () => {
      const { lng: nextLng, lat: nextLat } = marker.getLngLat();
      void handlePinMove(nextLat, nextLng);
    });

    map.on("click", (event) => {
      if (disabled) return;
      const { lng: nextLng, lat: nextLat } = event.lngLat;
      marker.setLngLat([nextLng, nextLat]);
      void handlePinMove(nextLat, nextLng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
    // Mount once; later lat/lng sync via separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (disabled) {
      map.boxZoom.disable();
      map.scrollZoom.disable();
      map.dragPan.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      markerRef.current?.setDraggable(false);
    } else {
      map.boxZoom.enable();
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.dragRotate.enable();
      map.keyboard.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
      markerRef.current?.setDraggable(true);
    }
  }, [disabled]);

  useEffect(() => {
    syncMarker(lat, lng);
  }, [lat, lng, syncMarker]);

  const runSearch = async (force = false) => {
    const q = address.trim();
    if (!q || disabled) return;
    if (!force && q === lastResolvedAddressRef.current) return;

    setSearching(true);
    setSearchError(null);
    try {
      const result = await searchAddressAction(q);
      if (!result) {
        setSearchError(
          "No location found for that address. Try again or pin the map."
        );
        return;
      }
      skipReverseRef.current = true;
      lastResolvedAddressRef.current = result.displayName.trim();
      onCoordsChange(result.lat, result.lng);
      onAddressChange(result.displayName);
      syncMarker(result.lat, result.lng);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClassName} htmlFor="event-location-address">
          Address
        </label>
        <div className="flex gap-2">
          <input
            id="event-location-address"
            className={inputClassName}
            value={address}
            onChange={(e) => {
              setSearchError(null);
              onAddressChange(e.target.value);
            }}
            onBlur={() => {
              void runSearch(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch(true);
              }
            }}
            placeholder="Search an address…"
            required
            disabled={disabled}
          />
          <button
            type="button"
            disabled={disabled || searching || !address.trim()}
            onClick={() => void runSearch(true)}
            className="shrink-0 rounded-xl border border-firefly/30 px-3.5 py-2.5 text-sm font-medium text-firefly transition-all hover:bg-firefly/10 disabled:opacity-50"
          >
            {searching ? "…" : "Search"}
          </button>
        </div>
        {searchError ? (
          <p className="mt-1.5 text-xs text-destructive">{searchError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-foreground/40">
            Search an address or click / drag the pin on the map.
          </p>
        )}
      </div>

      <div
        ref={containerRef}
        className="h-[240px] w-full overflow-hidden rounded-xl border border-firefly/20"
        aria-label="Location map"
      />
    </div>
  );
}
