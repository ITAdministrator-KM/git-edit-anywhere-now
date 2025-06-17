import { forwardRef, AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn('text-sm font-medium no-underline hover:underline', className)}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = 'Link';

export default Link;