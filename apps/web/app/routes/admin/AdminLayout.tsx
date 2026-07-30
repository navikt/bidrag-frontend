import {Page, VStack} from "@navikt/ds-react";
import {Outlet} from "react-router";
import type {Route} from "./+types/AdminLayout";

export default function AdminLayout({params}: Route.ComponentProps) {

    return (
        <VStack gap={"space-32"}>

            <Page.Block width="xl">
                <Outlet/>
            </Page.Block>
        </VStack>
    );
}
