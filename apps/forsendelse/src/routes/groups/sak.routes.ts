import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Forsendelse/notat i sakskontekst. Nestes som barn av web-appens
 * `sak/:saksnummer`-layout (`SakBaseLayout`), derfor relative stier uten
 * `sak/:saksnummer`-prefiks.
 */
export default [
    route("forsendelse", "../OpprettForsendelseRoute.tsx", { id: "sak-opprett-forsendelse" }),
    route("notat", "../OpprettNotatRoute.tsx", { id: "sak-opprett-notat" }),
    route("forsendelse/:forsendelseId", "../ForsendelseRoute.tsx", { id: "sak-forsendelse-visning" }),
] satisfies RouteConfig;
