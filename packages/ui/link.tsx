import { forwardRef } from "react";
import { Link as ReactRouterLink } from "react-router-dom";

export const Link = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { href: string }
>(function Link({ href, ...props }, ref) {
  if (href.startsWith("http"))
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props} ref={ref} />;
  return <ReactRouterLink to={href} {...props} ref={ref} />;
});
