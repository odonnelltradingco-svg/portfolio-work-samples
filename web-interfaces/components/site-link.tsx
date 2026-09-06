import type { ComponentProps } from 'react';

// The static host serves complete documents. Native navigation also works when
// client-router requests are unavailable, keeping portfolio examples reachable.
export function SiteLink({ children, ...props }: ComponentProps<'a'>) {
  return <a {...props}>{children}</a>;
}
