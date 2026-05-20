import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Smartphone, Moon, Sun, FileJson, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { exportAllDataAsJSON } from '@/lib/data-management';
import { toast } from 'sonner';

interface SettingsSectionProps {
  onExportData: () => void;
}

export function SettingsSection({ onExportData }: SettingsSectionProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isExportingJson, setIsExportingJson] = useState(false);

  const handleExportJSON = async () => {
    if (!user?.id) return;
    setIsExportingJson(true);
    try {
      await exportAllDataAsJSON(user.id);
      toast.success('All data exporterad till JSON');
    } catch (e: any) {
      toast.error('Kunde inte exportera data', { description: e.message });
    } finally {
      setIsExportingJson(false);
    }
  };

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

        {/* Export CSV */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ios-md bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Exportera CSV</p>
              <p className="text-xs text-muted-foreground">
                Pass och set i tabellformat
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-ios-md" onClick={onExportData} aria-label="Exportera till CSV">
            Exportera
          </Button>
        </div>

        {/* Export full JSON */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ios-md bg-primary/10">
              <FileJson className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Exportera all data (JSON)</p>
              <p className="text-xs text-muted-foreground">
                Full backup – profil, pass, mål, foton-länkar m.m.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-ios-md"
            onClick={handleExportJSON}
            disabled={isExportingJson}
            aria-label="Exportera all data som JSON"
          >
            {isExportingJson ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'JSON'}
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
