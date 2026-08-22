import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "start";
  className?: string;
};

export function SectionHeading({
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
      {description ? (
        <p className={cn("mt-2 text-text-muted", align === "center" && "mx-auto max-w-2xl")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
