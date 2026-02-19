import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: 'primary' | 'accent' | false;
}

export function Card({ children, className = '', glow = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-xl p-4 ${glow ? (glow === 'primary' ? 'glow-primary' : 'glow-accent') : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
