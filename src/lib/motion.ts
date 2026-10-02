/** Shared motion profile so every animation feels like the same app. */
export const DURATION = { fast: 0.15, normal: 0.25, slow: 0.4 };
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 } as const;

export const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
export const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE_OUT } },
};
