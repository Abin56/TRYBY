"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { forwardRef, ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
  {
    variants: {
      variant: {
        primary:
          "shimmer-btn bg-[#2563EB] text-white rounded-[8px] hover:bg-[#1D4ED8] hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_16px_rgba(37,99,235,0.2)] hover:shadow-[0_0_32px_rgba(37,99,235,0.4)]",
        outline:
          "border border-[#2563EB] text-[#2563EB] rounded-[8px] hover:bg-[rgba(37,99,235,0.08)] hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "text-white rounded-[8px] hover:bg-[#1A1A1A] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-[#EF4444] text-white rounded-[8px] hover:bg-red-600 hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-[#161616] border border-[#2D2D2D] text-white rounded-[8px] hover:bg-[#1F1F1F] hover:border-[#3D3D3D] hover:-translate-y-0.5 active:translate-y-0",
        link: "text-[#2563EB] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm:   "h-8  px-3 text-sm",
        md:   "h-10 px-5 text-sm",
        lg:   "h-12 px-7 text-base",
        xl:   "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
