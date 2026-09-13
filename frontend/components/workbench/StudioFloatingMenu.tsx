"use client";

import { useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  labelledBy?: string;
  label?: string;
  id?: string;
  role?: "dialog" | "listbox";
  className?: string;
  children: ReactNode;
};

const MENU_WIDTH = 320;

export function StudioFloatingMenu({
  open,
  onClose,
  anchorRef,
  labelledBy,
  label,
  id,
  role = "dialog",
  className,
  children,
}: Props) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.min(MENU_WIDTH, window.innerWidth - 16);
      let left = r.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = r.bottom + 6;
      const estimated = 360;
      if (top + estimated > window.innerHeight - 8 && r.top > estimated) {
        top = Math.max(8, r.top - estimated - 6);
      }
      setPos({ top, left, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  if (!open || !pos) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default bg-transparent"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        id={id}
        role={role}
        aria-modal={role === "dialog" ? true : undefined}
        aria-labelledby={labelledBy}
        aria-label={!labelledBy ? label : undefined}
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        className={cn(
          "fixed z-[201] max-h-[min(24rem,calc(100vh-2rem))] overflow-auto rounded-xl border border-white/15 bg-[#0a0a0a] text-white shadow-2xl ring-1 ring-black",
          className,
        )}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
