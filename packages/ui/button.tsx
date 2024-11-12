import type { VariantProps } from "cva";
import { forwardRef } from "react";

import { buttonVariants } from "./button-variants";
import { cn } from "./cn";
import { Link } from "./link";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { variants?: VariantProps<typeof buttonVariants> }
>(function Button({ variants, className, children, ...rest }, ref) {
  return (
    <button
      className={cn(buttonVariants({ ...variants, className }))}
      type="button"
      {...rest}
      ref={ref}
    >
      {children}
    </button>
  );
});

export const LinkButton = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & { variants?: VariantProps<typeof buttonVariants> }
>(function LinkButton({ variants, className, children, ...rest }, ref) {
  return (
    <Link className={cn(buttonVariants({ ...variants, className }))} {...rest} ref={ref}>
      {children}
    </Link>
  );
});
