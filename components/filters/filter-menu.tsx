"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { FilterChip } from "@/components/filters/filter-chip";

type MenuContextValue = {
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
};

const FilterMenuContext = createContext<MenuContextValue | null>(null);

export function FilterMenuProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = useMemo(
    () => ({ openId, setOpenId }),
    [openId]
  );

  return (
    <FilterMenuContext.Provider value={value}>
      {children}
    </FilterMenuContext.Provider>
  );
}

function useFilterMenu(id: string) {
  const ctx = useContext(FilterMenuContext);
  if (!ctx) {
    throw new Error("FilterDropdown must be used within FilterMenuProvider");
  }

  const { openId, setOpenId } = ctx;
  const open = openId === id;
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenId((current) => {
        if (next) return id;
        return current === id ? null : current;
      });
    },
    [id, setOpenId]
  );

  return { open, setOpen };
}

type FilterDropdownProps = {
  id?: string;
  label: string;
  valueLabel?: string;
  active: boolean;
  align?: "start" | "end";
  children: (close: () => void) => ReactNode;
};

export function FilterDropdown({
  id,
  label,
  valueLabel,
  active,
  align = "start",
  children,
}: FilterDropdownProps) {
  const generatedId = useId();
  const menuId = id ?? generatedId;
  const { open, setOpen } = useFilterMenu(menuId);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menu?.offsetWidth ?? 240;
    const viewportPad = 12;
    let left =
      align === "end" ? rect.right - menuWidth : rect.left;

    left = Math.min(
      left,
      window.innerWidth - menuWidth - viewportPad
    );
    left = Math.max(viewportPad, left);

    setCoords({
      top: rect.bottom + 8,
      left,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(updatePosition);

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close, updatePosition]);

  const displayLabel = active && valueLabel ? valueLabel : label;

  return (
    <>
      <FilterChip
        ref={triggerRef}
        active={active}
        open={open}
        chevron
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => setOpen(!open)}
      >
        {displayLabel}
      </FilterChip>
      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              role="presentation"
              style={
                coords
                  ? { top: coords.top, left: coords.left }
                  : { visibility: "hidden" }
              }
              className="fixed z-[60] max-h-[min(28rem,calc(100dvh-6rem))] min-w-[13.5rem] overflow-y-auto overscroll-contain rounded-2xl border border-firefly/20 bg-surface-1 py-1 shadow-2xl"
            >
              {children(close)}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
