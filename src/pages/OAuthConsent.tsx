import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Loader2, ShieldCheck } from "lucide-react";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Länken saknar authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?next=${encodeURIComponent(next)}`;
        return;
      }
      setEmail(sess.session.user.email ?? null);

      try {
        const { data, error: detailsError } = await oauthApi().getAuthorizationDetails(
          authorizationId,
        );
        if (!active) return;
        if (detailsError) {
          setError(detailsError.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Okänt fel");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const api = oauthApi();
      const { data, error: decisionError } = approve
        ? await api.approveAuthorization(authorizationId)
        : await api.denyAuthorization(authorizationId);
      if (decisionError) {
        setBusy(false);
        setError(decisionError.message);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("Ingen returadress kom tillbaka från servern.");
        return;
      }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Okänt fel");
    }
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "Appen";
  const redirectUri =
    details?.client?.redirect_uri ?? details?.client?.redirect_uris?.[0] ?? null;
  const scopes: string[] = (details?.scope ?? details?.scopes ?? "")
    .toString()
    .split(" ")
    .filter(Boolean);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="font-heading text-xl">
            {details ? `Koppla ${clientName} till GymBro3000` : "Behörighet"}
          </CardTitle>
          <CardDescription>
            {email ? `Inloggad som ${email}` : "Kontrollerar din inloggning…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {!details && !error && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </div>
          )}

          {details && (
            <>
              <p className="text-sm text-muted-foreground">
                {clientName} kan då använda appens verktyg som dig: läsa dina pass, din
                övningshistorik och din kroppsvikt, samt skapa och ändra planerade pass.
                Genomförda pass kan inte ändras.
              </p>

              {redirectUri && (
                <p className="text-xs text-muted-foreground break-all">
                  Returadress: {redirectUri}
                </p>
              )}

              {scopes.length > 0 && (
                <ul className="text-sm space-y-1">
                  {scopes.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                      {s === "openid" && "Bekräfta vem du är"}
                      {s === "email" && "Dela din e-postadress"}
                      {s === "profile" && "Dela din grundläggande profil"}
                      {!["openid", "email", "profile"].includes(s) && `Behörighet: ${s}`}
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-muted-foreground">
                Det här går förbi varken appens behörigheter eller databasens skyddsregler.
              </p>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Godkänn"}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={busy}
                  onClick={() => decide(false)}
                >
                  Avbryt
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
