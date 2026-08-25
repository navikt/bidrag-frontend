import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

export default [
    route("behandling/:behandlingId/notat", "../NotatRoute.tsx", { id: "behandling-notat" }),
    route("sak/:saksnummer/behandling/:behandlingId/notat", "../NotatRoute.tsx", { id: "sak-behandling-notat" }),
    route("vedtak/:vedtakId/notat", "../NotatRoute.tsx", { id: "vedtak-notat" }),
] satisfies RouteConfig;
