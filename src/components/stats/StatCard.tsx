import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  subtitle?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, subtitle, className }: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = trend !== undefined && trend > 0;

  return (
    <Card className={cn("bg-card/50 border-border/50", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
          {hasTrend && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isPositive ? '+' : ''}{trend.toFixed(0)}%</span>
            </div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
