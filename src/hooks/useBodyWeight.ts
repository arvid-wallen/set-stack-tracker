import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface BodyWeightEntry {
  id: string;
  weight_kg: number;
  logged_at: string;
  notes: string | null;
}

export function useBodyWeight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['body-weight', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<BodyWeightEntry[]> => {
      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('id, weight_kg, logged_at, notes')
        .order('logged_at', { ascending: false })
        .limit(365);
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id,
        weight_kg: Number(r.weight_kg),
        logged_at: r.logged_at,
        notes: r.notes,
      }));
    },
  });

  const logWeight = useMutation({
    mutationFn: async ({
      weight_kg,
      logged_at,
      notes,
    }: {
      weight_kg: number;
      logged_at?: string;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('Inte inloggad');
      const date = logged_at ?? new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from('body_weight_logs')
        .upsert(
          { user_id: user.id, weight_kg, logged_at: date, notes: notes ?? null },
          { onConflict: 'user_id,logged_at' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-weight'] });
      toast({ title: 'Vikt sparad' });
    },
    onError: (error: any) => {
      toast({ title: 'Kunde inte spara vikten', description: error.message, variant: 'destructive' });
    },
  });

  const deleteWeight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('body_weight_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-weight'] });
    },
  });

  const entries = query.data ?? [];
  const latest = entries[0] ?? null;
  const previous = entries[1] ?? null;

  return {
    entries,
    latest,
    change: latest && previous ? Math.round((latest.weight_kg - previous.weight_kg) * 10) / 10 : null,
    isLoading: query.isLoading,
    logWeight,
    deleteWeight,
  };
}
