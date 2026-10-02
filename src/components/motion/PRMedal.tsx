import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

export function PRMedal({ weight, show }: { weight: number | null; show: boolean }) {
  return (
    <AnimatePresence>
      {show && weight != null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="mb-3 flex items-center gap-3 rounded-ios-lg bg-primary px-3 py-2 text-primary-foreground shadow-ios"
          style={{ transformPerspective: 600 }}
          role="status"
        >
          <motion.span
            animate={{ rotate: [0, -12, 12, -6, 0] }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/40"
          >
            <Trophy className="h-4 w-4" />
          </motion.span>
          <div className="text-sm leading-tight">
            <p className="font-semibold">Nytt personbästa!</p>
            <p className="opacity-80">{weight} kg – tyngsta hittills</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
