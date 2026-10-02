type Pattern = 'light' | 'success' | 'heavy';

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 10,
  success: [12, 40, 18],
  heavy: [20, 30, 40],
};

/** Subtle vibration on devices that support it. No-op elsewhere. */
export function haptic(pattern: Pattern = 'light') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    /* ignore */
  }
}
