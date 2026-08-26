import { HStack, Page, VStack } from "@navikt/ds-react";
import { Outlet } from "react-router";
import { useHentPersoninformasjon } from "~/api/useApi";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import BrukerMeny from "~/routes/bruker/BrukerMeny";
import type { Route } from "./+types/BrukerLayout";
import { BrukerHeader } from "./BrukerHeader";

export default function BrukerLayout({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const ident = decodeFnr(brukerId);
    const { data: bruker, isLoading, error } = useHentPersoninformasjon({ ident });

    if (isLoading || bruker === undefined) {
        return "loading...";
    }

    if (error) {
        return error.message;
    }

    return (
        <VStack gap={"space-32"}>
            <BrukerHeader bruker={bruker} />
            <HStack gap={"space-32"} wrap={false}>
                <BrukerMeny brukerId={brukerId} />
                <Page.Block width="2xl" style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <Outlet />
                </Page.Block>
            </HStack>
        </VStack>
    );
}
