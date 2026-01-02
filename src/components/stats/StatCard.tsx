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
    <Card className={cn("rounded-2xl shadow-ios bg-card/80", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="p-1.5 rounded-ios-sm bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium">{label}</span>
          </div>
          {hasTrend && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
              isPositive ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"
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
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
