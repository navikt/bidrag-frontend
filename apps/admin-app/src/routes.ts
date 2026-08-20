import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route, index } = relative(import.meta.dirname);

// Define routes for the Admin module
export default [
    index("AdminIndexPage.tsx"),
    route("endringslogg", "./endringslogg/EndringsloggLayout.tsx", [
        index("./endringslogg/index.tsx"),
        route("ny", "./endringslogg/EndringsloggCreatePage.tsx"),
        route(":id", "./endringslogg/EndringsloggEditPage.tsx"),
    ]),
    route("dokumentasjon", "./dokumentasjon/DokumentasjonPage.tsx"),
    route("vedtak/explorer", "./vedtak/explorer/VedtakExplorerPage.tsx"),
] satisfies RouteConfig;
