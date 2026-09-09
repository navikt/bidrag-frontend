
// biome-ignore lint/complexity/noStaticOnlyClass: Hjelpefunksjoner
export class SecuritySessionUtils {

    static async hentSaksbehandler(): Promise<NavUser | undefined> {
        const response = await fetch("/me", { method: "GET", headers: { Accept: "application/json" } });

        // Ved utløpt sesjon redirecter Wonderwall til innloggingssiden. fetch følger
        // redirecten, så vi må sjekke innholdstypen og ikke bare response.ok.
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
            return undefined;
        }

        return (await response.json()) as NavUser;
    }

    static async hentSaksbehandlerId(): Promise<string | undefined> {
        return (await SecuritySessionUtils.hentSaksbehandler())?.NAVident;
    }
}

/** Innlogget saksbehandler slik /me returnerer den. */
export interface NavUser {
    NAVident: string;
    name: string;
    username: string;
}

