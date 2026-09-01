// Dokument-appen kjører som en del av bidrag-frontend (React Router). Alle
// backend-kall går via /proxy/<app> og alle eksterne systemer nås via
// redirect-ruter i apps/web. Derfor trengs ingen byggtids-miljøvariabler her.
const system = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};

const url = {
    /** Bygger URL til `/bisys/:target`-redirect-ruten i apps/web, som slår opp BISYS_URL på serveren. */
    bisys: (
        target: "sak" | "sakForside" | "sakshistorikk" | "oppgaveliste" | "oppgavePopup" | "brukeroversikt",
        params?: Record<string, string>,
    ) => {
        const searchParams = new URLSearchParams(params).toString();
        return `/bisys/${target}${searchParams ? `?${searchParams}` : ""}`;
    },
};

export default { url, system };
