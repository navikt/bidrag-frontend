import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

export default [
    route("sak/:saksnummer/behandling/:behandlingId", "../BehandlingRoute.tsx", { id: "sak-behandling" }),
    route("sak/:saksnummer/behandling/:behandlingId/begrunnelse/:broadcastChannel", "../BegrunnelseRoute.tsx", {
        id: "sak-behandling-begrunnelse",
    }),
] satisfies RouteConfig;
