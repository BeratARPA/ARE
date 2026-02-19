import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white',
  ghost: 'bg-white/5 hover:bg-white/10 text-surface-200',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}
