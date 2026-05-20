import confetti from 'canvas-confetti';

export function celebrate() {
  // Respect reduced motion
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const colors = ['#aafcae', '#313231', '#f2f0eb'];
  const defaults = {
    startVelocity: 35,
    spread: 70,
    ticks: 180,
    zIndex: 9999,
    colors,
    disableForReducedMotion: true,
  };

  // Center burst
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.6 } });
  // Side puffs
  setTimeout(() => confetti({ ...defaults, particleCount: 40, angle: 60, origin: { x: 0, y: 0.7 } }), 120);
  setTimeout(() => confetti({ ...defaults, particleCount: 40, angle: 120, origin: { x: 1, y: 0.7 } }), 120);
}
