// Redigering-appen kjører som en del av bidrag-frontend (React Router). Alle
// backend-kall går via /proxy/<app> og alle eksterne systemer nås via
// redirect-ruter i apps/web. Derfor trengs ingen byggtids-miljøvariabler her.
const system = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};

const feature = {
    validatePDF: typeof window !== "undefined" && window.localStorage.getItem("validate_pdf") === "true",
    debugPage: typeof window !== "undefined" && window.localStorage.getItem("ENABLE_DEBUG_PAGE") === "true",
};

const url = {};

export default { url, system, feature };
