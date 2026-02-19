import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = 'rgba(92,124,250,0.2)', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ background: color }}
    >
      {children}
    </span>
  );
}
