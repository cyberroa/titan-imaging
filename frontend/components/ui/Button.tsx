import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const variantClasses = {
  primary:
    "bg-white text-black hover:bg-accent-titanium",
  secondary:
    "border-2 border-white bg-transparent text-white hover:border-accent-titanium hover:text-accent-titanium",
  accent:
    "bg-accent-titanium text-black hover:brightness-110",
} as const;

const sizeClasses = {
  sm: "px-6 py-3 text-sm",
  md: "px-8 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

const baseClasses =
  "inline-flex items-center justify-center rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-70";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  onClick,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}
