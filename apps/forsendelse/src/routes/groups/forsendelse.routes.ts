import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Toppnivåruter for forsendelse (utenfor sakskontekst). Nestes direkte i
 * web-appens rot-rutetre, på samme måte som behandlings brukerveiledningsruter.
 */
export default [
    route("forsendelse/brukerveiledning", "../BrukerveiledningRoute.tsx"),
    route("forsendelse/:forsendelseId", "../ForsendelseRoute.tsx", { id: "forsendelse-visning" }),
] satisfies RouteConfig;
