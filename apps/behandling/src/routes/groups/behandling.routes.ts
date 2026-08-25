import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

export default [
    route("behandling/:behandlingId/notat", "../NotatRoute.tsx", { id: "behandling-notat" }),
    route("behandling/:behandlingId", "../BehandlingRoute.tsx", { id: "behandling" }),
    route("behandling/:behandlingId/begrunnelse/:broadcastChannel", "../BegrunnelseRoute.tsx", {
        id: "behandling-begrunnelse",
    }),
    route("vedtak/:vedtakId/notat", "../NotatRoute.tsx", { id: "vedtak-notat" }),
] satisfies RouteConfig;
