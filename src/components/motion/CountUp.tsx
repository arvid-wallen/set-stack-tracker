import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = value.toFixed(decimals);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { el.textContent = v.toFixed(decimals); },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, decimals, reduce]);

  return <span ref={ref} className={className}>{(0).toFixed(decimals)}</span>;
}
