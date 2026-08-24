// Behandling-appen kjører som en del av bidrag-frontend (React Router). Alle
// backend-kall går via /proxy/<app> og alle eksterne systemer nås via
// redirect-ruter i apps/web. Derfor trengs ingen byggtids-miljøvariabler her.
const system = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    sporingEnabled: true,
};

const url = {
    /** Redirect-rute i apps/web som slår opp BISYS_URL på serveren */
    bisysSak: "/bisys/sak",
    bisysSakshistorikk: "/bisys/sakshistorikk",
    /** Redirect-rute i apps/web som slår opp MODIA_URL på serveren */
    modiaPerson: "/modia/person",
    forskuddBrukerveiledning: "/behandling/brukerveiledning/forskudd",
    bidragBrukerveiledning: "/behandling/brukerveiledning/bidrag",
    bidragBrukerveiledningKlage: "/behandling/brukerveiledning/bidrag?klage=true",
    særbidragBrukerveiledning: "/behandling/brukerveiledning/sarbidrag",
};

export default { url, system };
