import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

const spacingClasses = {
  standard: "py-16 md:py-20",
  tight: "py-12",
  none: "",
} as const;

type SectionSpacing = keyof typeof spacingClasses;

type SectionProps<T extends ElementType = "section"> = {
  as?: T;
  spacing?: SectionSpacing;
  className?: string;
  children: ReactNode;
};

export function Section<T extends ElementType = "section">({
  as,
  spacing = "standard",
  className,
  children,
}: SectionProps<T>) {
  const Tag = as ?? "section";
  return <Tag className={cn(spacingClasses[spacing], className)}>{children}</Tag>;
}
