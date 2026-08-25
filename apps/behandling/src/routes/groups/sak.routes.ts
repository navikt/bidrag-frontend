import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Behandling i sakskontekst. Nestes som barn av web-appens `sak/:saksnummer`-layout
 * (`SakBaseLayout`), derfor relative stier uten `sak/:saksnummer`-prefiks.
 * Notat er brutt ut i egen fil.
 */
export default [
    route("behandling/:behandlingId", "../BehandlingRoute.tsx", { id: "sak-behandling" }),
    route("behandling/:behandlingId/notat", "../NotatRoute.tsx", { id: "sak-behandling-notat" }),
    route("vedtak/:vedtakId", "../BehandlingRoute.tsx", { id: "sak-vedtak" }),
    route("behandling/:behandlingId/begrunnelse/:broadcastChannel", "../BegrunnelseRoute.tsx", {
        id: "sak-behandling-begrunnelse",
    }),
] satisfies RouteConfig;
