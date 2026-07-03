import {Page, VStack} from "@navikt/ds-react";
import {Outlet} from "react-router";
import {useObfusicateFnr} from "~/common/person/useObfusicateFnr.ts";
import type {Route} from "./+types/BrukerLayout";

export default function BrukerLayout({params}: Route.ComponentProps) {
    const {decodeFnr} = useObfusicateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId)

    return (
        <VStack gap={"space-32"}>
            <div>Header for Bruker : {fnr}</div>
            <Page.Block width="xl">
                <Outlet/>
            </Page.Block>
        </VStack>
    );
}
