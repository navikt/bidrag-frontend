import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

export default [
    route("behandling/:behandlingId", "../BehandlingRoute.tsx", { id: "behandling" }),
    route("behandling/:behandlingId/begrunnelse/:broadcastChannel", "../BegrunnelseRoute.tsx", {
        id: "behandling-begrunnelse",
    }),
] satisfies RouteConfig;
