import {Outlet} from "react-router";
import {ClientOnly} from "~/routes/ClientOnly.tsx";
import {Loader} from "@navikt/ds-react";

export default function RootLayout() {

    return <ClientOnly fallback={<Loader size="large"/>}>
        <Outlet/>
    </ClientOnly>
}
