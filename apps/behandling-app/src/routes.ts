import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Ruter for behandling (migrert fra den frittstående bidrag-behandling-ui).
 *
 * Rutene ligger under tre ulike URL-røtter, så de spres inn i web-appens routes.ts
 * uten felles prefiks. Eksplisitte id-er trengs fordi samme rutefil brukes flere ganger.
 */
export default [
    route("behandling/brukerveiledning/forskudd", "./routes/ForskuddBrukerveiledningRoute.tsx"),
    route("behandling/brukerveiledning/bidrag", "./routes/BidragBrukerveiledningRoute.tsx"),
    route("behandling/brukerveiledning/sarbidrag", "./routes/SaerbidragBrukerveiledningRoute.tsx"),

    route("behandling/:behandlingId", "./routes/BehandlingRoute.tsx", { id: "behandling" }),
    route("behandling/:behandlingId/notat", "./routes/NotatRoute.tsx", { id: "behandling-notat" }),
    route("behandling/:behandlingId/begrunnelse/:broadcastChannel", "./routes/BegrunnelseRoute.tsx", {
        id: "behandling-begrunnelse",
    }),

    route("sak/:saksnummer/behandling/:behandlingId", "./routes/BehandlingRoute.tsx", { id: "sak-behandling" }),
    route("sak/:saksnummer/behandling/:behandlingId/notat", "./routes/NotatRoute.tsx", { id: "sak-behandling-notat" }),
    route("sak/:saksnummer/behandling/:behandlingId/begrunnelse/:broadcastChannel", "./routes/BegrunnelseRoute.tsx", {
        id: "sak-behandling-begrunnelse",
    }),

    route("vedtak/:vedtaksid", "./routes/BehandlingRoute.tsx", { id: "vedtak" }),
    route("vedtak/:vedtaksid/notat", "./routes/NotatRoute.tsx", { id: "vedtak-notat" }),
] satisfies RouteConfig;
