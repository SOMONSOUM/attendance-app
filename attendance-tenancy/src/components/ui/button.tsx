import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
};

export function Button({
  className,
  asChild,
  variant = "default",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground hover:opacity-90",
        variant === "outline" &&
          "border border-border bg-background hover:bg-muted",
        variant === "ghost" && "hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
