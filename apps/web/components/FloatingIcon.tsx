'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// Decorative background icon used on full-screen error/404 states — a slow
// bob + slight rotation loop, staggered per instance via `delay` so a
// handful scattered around a screen don't all move in lockstep.
export function FloatingIcon({
  icon: Icon,
  className,
  duration = 6,
  delay = 0,
}: {
  icon: LucideIcon;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -16, 0], rotate: [0, 6, -6, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Icon className="h-full w-full" strokeWidth={1.5} />
    </motion.div>
  );
}
