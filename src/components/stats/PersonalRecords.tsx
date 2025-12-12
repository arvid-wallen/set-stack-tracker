import { Trophy, Weight, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface PersonalRecord {
  type: 'weight' | '1rm' | 'volume';
  value: number;
  date: string;
  reps?: number;
}

interface PersonalRecordsProps {
  records: PersonalRecord[];
}

const PR_CONFIG = {
  weight: {
    icon: Weight,
    label: 'Tyngst lyft',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  '1rm': {
    icon: Target,
    label: 'Bästa 1RM',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  volume: {
    icon: Flame,
    label: 'Högst volym',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
};

export function PersonalRecords({ records }: PersonalRecordsProps) {
  if (records.length === 0) {
    return null;
  }

  const formatValue = (record: PersonalRecord) => {
    if (record.type === 'volume' && record.value >= 1000) {
      return `${(record.value / 1000).toFixed(1)}t`;
    }
    if (record.type === 'weight' && record.reps) {
      return `${record.value}kg × ${record.reps}`;
    }
    return `${record.value}kg`;
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Personliga rekord
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {records.map((record) => {
            const config = PR_CONFIG[record.type];
            const Icon = config.icon;

            return (
              <div
                key={record.type}
                className={`flex items-center justify-between p-3 rounded-lg ${config.bgColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-background/50`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                    <p className="text-lg font-bold">{formatValue(record)}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {format(parseISO(record.date), 'd MMM yyyy', { locale: sv })}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
