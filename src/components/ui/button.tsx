import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color] duration-(--motion-quick,150ms) ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:opacity-90",
        secondary: "bg-bg-elevated text-fg border border-border hover:bg-bg-subtle",
        ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-bg-subtle",
      },
      size: {
        md: "h-11 px-5 rounded-[length:var(--radius-md)] text-sm",
        lg: "h-12 px-6 rounded-[length:var(--radius-lg)] text-base",
        icon: "size-12 rounded-[length:var(--radius-md)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
