import { forwardRef, type AnchorHTMLAttributes } from "react";
import { navigate } from "./routing";
const Link = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>(function Link({ href, onClick, children, ...props }, ref) {
  return (
    <a
      ref={ref}
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          e.altKey ||
          props.target ||
          props.download ||
          !href.startsWith("/") ||
          href.startsWith("//")
        )
          return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
});
export default Link;
