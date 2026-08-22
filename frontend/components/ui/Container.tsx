import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

const maxWidthClasses = {
  default: "max-w-6xl",
  narrow: "max-w-4xl",
  wide: "max-w-5xl",
  full: "max-w-none",
} as const;

type ContainerMaxWidth = keyof typeof maxWidthClasses;

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  maxWidth?: ContainerMaxWidth;
  className?: string;
  children: ReactNode;
};

export function Container<T extends ElementType = "div">({
  as,
  maxWidth = "default",
  className,
  children,
}: ContainerProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={cn("mx-auto w-full px-6", maxWidthClasses[maxWidth], className)}>
      {children}
    </Tag>
  );
}
