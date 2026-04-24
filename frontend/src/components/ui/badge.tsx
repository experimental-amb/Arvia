import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--brand))]/20 text-[hsl(var(--brand))] border-[hsl(var(--brand))]/30",
        secondary: "border-white/10 bg-white/5 text-foreground",
        outline: "text-foreground border-white/15",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-300",
        danger: "border-rose-500/30 bg-rose-500/15 text-rose-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
