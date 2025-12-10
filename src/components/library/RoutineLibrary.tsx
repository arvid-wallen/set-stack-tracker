import { useState } from 'react';
import { Plus, Star, Folder, ChevronDown, ChevronRight, Play, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRoutines, Routine } from '@/hooks/useRoutines';
import { useWorkout } from '@/hooks/useWorkout';
import { WORKOUT_TYPE_LABELS } from '@/types/workout';
import { CreateRoutineSheet } from './CreateRoutineSheet';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export function RoutineLibrary() {
  const { routines, isLoading, toggleFavorite, deleteRoutine, updateLastUsed, getRoutinesByFolder, refetch } = useRoutines();
  const { startWorkout, addExercise, activeWorkout } = useWorkout();
  const navigate = useNavigate();
  
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const { favorites, byFolder, noFolder } = getRoutinesByFolder();

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const handleStartFromRoutine = async (routine: Routine) => {
    // Start a new workout session
    await startWorkout(routine.workout_type, routine.workout_type === 'custom' ? routine.name : undefined);
    
    // Add all exercises from the routine
    if (routine.exercises) {
      for (const re of routine.exercises) {
        if (re.exercise) {
          await addExercise(re.exercise.id);
        }
      }
    }

    // Update last used
    await updateLastUsed(routine.id);
    
    // Navigate to home (where the active workout is shown)
    navigate('/');
  };

  const handleDelete = async () => {
    if (routineToDelete) {
      await deleteRoutine(routineToDelete);
      setRoutineToDelete(null);
    }
  };

  const RoutineCard = ({ routine }: { routine: Routine }) => (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{routine.name}</h4>
            <Badge variant="secondary" className="text-xs shrink-0">
              {WORKOUT_TYPE_LABELS[routine.workout_type as keyof typeof WORKOUT_TYPE_LABELS] || routine.workout_type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{routine.exercises?.length || 0} övningar</span>
            {routine.last_used_at && (
              <>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(routine.last_used_at), { 
                    addSuffix: true, 
                    locale: sv 
                  })}
                </span>
              </>
            )}
          </div>

          {routine.exercises && routine.exercises.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {routine.exercises.slice(0, 3).map(e => e.exercise?.name).filter(Boolean).join(', ')}
              {routine.exercises.length > 3 && ` +${routine.exercises.length - 3}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toggleFavorite(routine.id)}
          >
            <Star className={cn(
              "h-4 w-4",
              routine.is_favorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
            )} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setRoutineToDelete(routine.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Button
        className="w-full mt-3 h-10"
        onClick={() => handleStartFromRoutine(routine)}
        disabled={!!activeWorkout}
      >
        <Play className="h-4 w-4 mr-2" />
        {activeWorkout ? 'Pass pågår redan' : 'Starta pass'}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      <Button 
        onClick={() => setShowCreateSheet(true)}
        className="w-full h-12"
      >
        <Plus className="h-5 w-5 mr-2" />
        Skapa ny rutin
      </Button>

      {routines.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga rutiner skapade ännu</p>
          <p className="text-sm mt-1">Skapa din första rutin för snabbare pass!</p>
        </div>
      ) : (
        <>
          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                Favoriter
              </h3>
              <div className="space-y-2">
                {favorites.map(routine => (
                  <RoutineCard key={routine.id} routine={routine} />
                ))}
              </div>
            </div>
          )}

          {/* Folders */}
          {Object.entries(byFolder).map(([folder, routinesInFolder]) => (
            routinesInFolder.length > 0 && (
              <div key={folder} className="space-y-2">
                <button
                  onClick={() => toggleFolder(folder)}
                  className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide w-full text-left"
                >
                  {expandedFolders.has(folder) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Folder className="h-4 w-4" />
                  {folder}
                  <span className="text-xs font-normal">({routinesInFolder.length})</span>
                </button>
                
                {expandedFolders.has(folder) && (
                  <div className="space-y-2 ml-2">
                    {routinesInFolder.map(routine => (
                      <RoutineCard key={routine.id} routine={routine} />
                    ))}
                  </div>
                )}
              </div>
            )
          ))}

          {/* No folder */}
          {noFolder.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Utan mapp
              </h3>
              <div className="space-y-2">
                {noFolder.map(routine => (
                  <RoutineCard key={routine.id} routine={routine} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CreateRoutineSheet
        isOpen={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onCreated={() => {
          setShowCreateSheet(false);
          refetch();
        }}
      />

      <AlertDialog open={!!routineToDelete} onOpenChange={() => setRoutineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort rutin?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna rutin? Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
