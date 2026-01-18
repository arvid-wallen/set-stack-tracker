import { Exercise } from '@/types/workout';

// Common exercise name mappings (Swedish/English)
const exerciseAliases: Record<string, string[]> = {
  'bench press': ['bänkpress', 'bänk', 'bench', 'flat bench press', 'flat bench'],
  'incline bench press': ['incline bänkpress', 'incline bench', 'lutande bänkpress'],
  'decline bench press': ['decline bänkpress', 'decline bench'],
  'dumbbell press': ['hantelpress', 'dumbbell bench press'],
  'overhead press': ['militärpress', 'axelpress', 'shoulder press', 'ohp', 'standing press'],
  'squat': ['knäböj', 'squats', 'back squat', 'barbell squat'],
  'front squat': ['front squat', 'frontböj'],
  'deadlift': ['marklyft', 'conventional deadlift'],
  'romanian deadlift': ['rdl', 'rumänska marklyft', 'romanian'],
  'lat pulldown': ['lat pulldown', 'latsdrag', 'pulldown'],
  'pull up': ['pullups', 'pull-ups', 'chins', 'chinups', 'chin-ups'],
  'barbell row': ['skivstångsrodd', 'bent over row', 'rows'],
  'dumbbell row': ['hantelrodd', 'one arm row', 'single arm row'],
  'cable row': ['kabelrodd', 'seated row', 'seated cable row'],
  'leg press': ['benpress', 'leg press'],
  'leg curl': ['bencurl', 'hamstring curl', 'lying leg curl'],
  'leg extension': ['benextension', 'leg extensions', 'quad extension'],
  'lunges': ['utfallssteg', 'lunge', 'walking lunges'],
  'bulgarian split squat': ['bulgarska utfallssteg', 'split squat'],
  'calf raise': ['tåhävning', 'calf raises', 'standing calf raise'],
  'bicep curl': ['bicepscurl', 'curls', 'barbell curl', 'dumbbell curl'],
  'hammer curl': ['hammarcurl', 'hammer curls'],
  'tricep pushdown': ['triceps pushdown', 'pushdowns', 'cable pushdown'],
  'tricep extension': ['tricepsextension', 'overhead extension', 'skull crusher'],
  'dips': ['dips', 'tricep dips', 'chest dips'],
  'lateral raise': ['sidolyft', 'lateral raises', 'side raises'],
  'front raise': ['frontlyft', 'front raises'],
  'face pull': ['face pulls', 'facepulls'],
  'cable fly': ['kabelflyes', 'cable flyes', 'cable crossover'],
  'chest fly': ['flyes', 'dumbbell fly', 'pec fly'],
  'plank': ['plankan', 'planks'],
  'crunch': ['crunches', 'sit ups', 'situps'],
  'russian twist': ['rysk twist', 'russian twists'],
  'hip thrust': ['hip thrusts', 'glute bridge'],
  'running': ['löpning', 'jogging', 'run'],
  'cycling': ['cykling', 'bike', 'cykel'],
  'rowing': ['rodd', 'row machine', 'erg'],
};

// Normalize string for comparison
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Calculate similarity score between two strings
function similarity(s1: string, s2: string): number {
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  
  // Exact match
  if (n1 === n2) return 1;
  
  // Contains match
  if (n1.includes(n2) || n2.includes(n1)) return 0.9;
  
  // Word-based matching
  const words1 = n1.split(' ');
  const words2 = n2.split(' ');
  const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  const wordScore = commonWords.length / Math.max(words1.length, words2.length);
  
  return wordScore * 0.8;
}

// Find best matching exercise from a list
export function findBestExerciseMatch(
  searchName: string,
  exercises: Exercise[]
): Exercise | null {
  if (!searchName || exercises.length === 0) return null;
  
  const normalizedSearch = normalize(searchName);
  let bestMatch: Exercise | null = null;
  let bestScore = 0;
  
  // Check aliases first
  for (const [canonical, aliases] of Object.entries(exerciseAliases)) {
    const allNames = [canonical, ...aliases];
    if (allNames.some(alias => normalize(alias) === normalizedSearch || 
                                normalizedSearch.includes(normalize(alias)) ||
                                normalize(alias).includes(normalizedSearch))) {
      // Found an alias match, search for the canonical name
      for (const exercise of exercises) {
        const exerciseNormalized = normalize(exercise.name);
        for (const name of allNames) {
          const score = similarity(exerciseNormalized, name);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = exercise;
          }
        }
      }
      if (bestScore > 0.6) return bestMatch;
    }
  }
  
  // Direct matching against exercise names
  for (const exercise of exercises) {
    const score = similarity(exercise.name, searchName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = exercise;
    }
    
    // Also check description
    if (exercise.description) {
      const descScore = similarity(exercise.description, searchName) * 0.7;
      if (descScore > bestScore) {
        bestScore = descScore;
        bestMatch = exercise;
      }
    }
  }
  
  // Only return if we have a reasonable match
  return bestScore > 0.4 ? bestMatch : null;
}

// Find multiple matching exercises
export function findExerciseMatches(
  searchName: string,
  exercises: Exercise[],
  limit: number = 3
): Exercise[] {
  if (!searchName || exercises.length === 0) return [];
  
  const scored = exercises.map(exercise => ({
    exercise,
    score: similarity(exercise.name, searchName)
  }));
  
  return scored
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.exercise);
}
