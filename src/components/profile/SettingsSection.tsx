import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Smartphone, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SettingsSectionProps {
  onExportData: () => void;
}

export function SettingsSection({ onExportData }: SettingsSectionProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="rounded-2xl shadow-ios">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Inställningar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Theme toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ios-md bg-primary/10">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Tema</p>
              <p className="text-xs text-muted-foreground">
                {theme === 'dark' ? 'Mörkt läge' : 'Ljust läge'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-ios-md"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            Byt tema
          </Button>
        </div>

        {/* Export data */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ios-md bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Exportera data</p>
              <p className="text-xs text-muted-foreground">
                Ladda ner all din träningsdata
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-ios-md" onClick={onExportData}>
            Exportera
          </Button>
        </div>

        {/* Future integrations */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 opacity-60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ios-md bg-muted">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Apple Health / Google Fit
              </p>
              <p className="text-xs text-muted-foreground">
                Synka med hälsoappar
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Kommer snart
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
