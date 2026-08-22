import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  as?: "p" | "span";
};

export function Eyebrow({ children, className, as: Tag = "p" }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
