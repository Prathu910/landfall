"use client";
import { motion, useReducedMotion } from "motion/react";
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
export function AnimatedNumber({ value }: { value: number | string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      key={value}
      initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
    >
      {value}
    </motion.span>
  );
}
