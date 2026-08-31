// Forsendelse-appen kjører som en del av bidrag-frontend (React Router). Alle
// backend-kall går via /proxy/<app> og alle eksterne systemer nås via
// redirect-ruter i apps/web. Derfor trengs ingen byggtids-miljøvariabler her.
const system = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};

const feature = {
    isDebug: typeof window !== "undefined" && window.localStorage.getItem("DEBUG_MODE") === "true",
};

const url = {
    /** Redirect-ruter i apps/web som slår opp BISYS_URL på serveren */
    bisysSak: "/bisys/sak",
    bisysSakshistorikk: "/bisys/sakshistorikk",
    bisysOppgaveliste: "/bisys/oppgaveliste",
};

export default { url, system, feature };
