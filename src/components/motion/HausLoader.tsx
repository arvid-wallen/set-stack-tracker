import hausLogo from '@/assets/haus-logo.png';

export function HausLoader({ label = 'Laddar…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-20 w-20">
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-haus-ping" />
          <span className="absolute inset-2 rounded-full bg-primary/50 animate-haus-ping [animation-delay:300ms]" />
          <span className="absolute inset-4 rounded-full bg-primary flex items-center justify-center shadow-ios-lg">
            <img src={hausLogo} alt="" className="h-4 opacity-80" />
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
