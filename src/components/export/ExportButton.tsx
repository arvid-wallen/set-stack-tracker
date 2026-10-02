import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV } from '@/lib/export-utils';
import { WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { toast } from 'sonner';

interface ExportButtonProps {
  workouts: WorkoutWithDetails[];
  disabled?: boolean;
}

export function ExportButton({ workouts, disabled }: ExportButtonProps) {
  const handleExportCSV = () => {
    if (workouts.length === 0) {
      toast.error('Inga träningspass att exportera');
      return;
    }
    
    try {
      exportToCSV(workouts);
      toast.success(`${workouts.length} pass exporterade till CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunde inte exportera data');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2" aria-label="Exportera">
          <Download className="h-4 w-4" />
          <span className="hidden min-[400px]:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportera till CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
