import {Page, VStack} from "@navikt/ds-react";
import {Outlet} from "react-router";
import {useObfuscateFnr} from "~/common/person/useObfuscateFnr.ts";
import type {Route} from "./+types/BrukerLayout";

export default function BrukerLayout({params}: Route.ComponentProps) {
    const {decodeFnr} = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId)

    return (
        <VStack gap={"space-32"}>
            <div>Header for Bruker : {fnr} TODO</div>
            <Page.Block width="xl">
                <Outlet/>
            </Page.Block>
        </VStack>
    );
}
