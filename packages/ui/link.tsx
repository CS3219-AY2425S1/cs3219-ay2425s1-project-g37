import { forwardRef } from "react";
import { Link as ReactRouterLink } from "react-router-dom";

export const Link = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { href: string; forceNativeAnchor?: boolean }
>(function Link({ href, forceNativeAnchor, ...props }, ref) {
  const Component = forceNativeAnchor ? "a" : ReactRouterLink;
  if (href.startsWith("http"))
    return (
      <Component
        href={href}
        to={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
        ref={ref}
      />
    );
  return <Component href={href} to={href} {...props} ref={ref} />;
});
