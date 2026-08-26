import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

export default [
    route("behandling/brukerveiledning/forskudd", "../ForskuddBrukerveiledningRoute.tsx"),
    route("behandling/brukerveiledning/bidrag", "../BidragBrukerveiledningRoute.tsx"),
    route("behandling/brukerveiledning/sarbidrag", "../SaerbidragBrukerveiledningRoute.tsx"),
] satisfies RouteConfig;
