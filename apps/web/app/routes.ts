import adminroutes from "@bidrag/admin-app/routes";
import behandlingroutes, { sakRoutes as behandlingSakRoutes } from "@bidrag/behandling/routes";
import dokumentroutes, { sakRoutes as dokumentSakRoutes } from "@bidrag/dokument/routes";
import forsendelseroutes, { sakRoutes as forsendelseSakRoutes } from "@bidrag/forsendelse/routes";
import redigeringroutes from "@bidrag/redigering/routes";
import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.ts"),
    route("internal/health/readiness", "./server/readiness.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("me", "./server/meRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),
    route("unleash/proxy/*", "./server/unleash/unleashProxyRoute.ts"),
    route("bisys/:target", "./routes/bisys/BisysRedirect.ts"),
    route("samhandler/*", "./routes/samhandler/SamhandlerRedirect.ts"),
    route("personsok", "./routes/personsok/PersonSøkPage.tsx"),
    // Ny sak opprettes uten kjent saksnummer, så ruten kan ikke ligge nestet
    // under "sak/:saksnummer" selv om filene ligger under saksroller-mappen.
    route("sak/opprett", "./routes/sak/saksroller/opprett-sak/OpprettSakPage.tsx"),
    route("opprettsakmodal", "./routes/sak/saksroller/opprett-sak/OpprettSakLegacyRedirect.ts"),
    route("modia/person", "./routes/modia/ModiaRedirect.ts"),
    route("aapnedokument", "./routes/dokument/ÅpneDokumentRedirect.ts"),
    route("aapnedokument/:journalpostId/:dokumentreferanse", "./routes/dokument/ÅpneDokumentMedReferanseRedirect.ts"),
    route("dokument/:journalpostId/:dokumentreferanse?", "./routes/dokument/journalpost/JournalpostPage.tsx"),

    index("routes/_index.tsx"),
    ...prefix("admin", adminroutes),

    // Behandling (migrert fra den frittstående bidrag-behandling-ui)
    ...behandlingroutes,

    // Forsendelse (migrert fra den frittstående bidrag-forsendelse-ui)
    ...forsendelseroutes,

    // Dokument (migrert fra den frittstående bidrag-dokument-ui)
    ...dokumentroutes,

    // Redigering (migrert fra den frittstående bidrag-redigering-ui)
    ...redigeringroutes,

    route("bruker/:brukerid", "./routes/bruker/BrukerLayout.tsx", [
        index("./routes/bruker/index.tsx"),
        route("reskontro", "./routes/bruker/reskontro/BrukerReskontroOversiktPage.tsx"),
        route("sumprsak", "./routes/bruker/sum_pr_sak/SumPrSakPage.tsx"),
        route("innkreving", "./routes/bruker/innkreving/InnkrevingPage.tsx"),
    ]),

    route("samhandler/søk", "./routes/samhandler/SamhandlerSøk.tsx"),
    route("samhandler/:samhandlerId", "./routes/samhandler/SamhandlerDetaljer.tsx"),

    route("sak/:saksnummer", "routes/sak/SakBaseLayout.tsx", [
        ...behandlingSakRoutes,
        ...forsendelseSakRoutes,
        ...dokumentSakRoutes,
        route("dokumenter", "routes/sak/dokumenter/SaksdokumenterPage.tsx"),

        layout("routes/sak/SakStandardLayout.tsx", [
            route("fogdhistorikk", "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx"),
            route("belopshistorikk", "routes/sak/beløpshistorikk/BeløpshistorikkPage.tsx"),
            route("sakshistorikk", "routes/sak/sakshistorikk/SakshistorikkPage.tsx"),
            route("reskontro", "routes/sak/reskontro/SakReskontroOversiktPage.tsx"),
        ]),

        route("saksroller", "routes/sak/saksroller/SaksrollerPage.tsx"),
    ]),
] satisfies RouteConfig;
