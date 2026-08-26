import { BrukerHeader } from "@bidrag/common";
import { Page, VStack } from "@navikt/ds-react";
import { Outlet } from "react-router";
import { useHentPersoninformasjon } from "~/api/useApi.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import type { Route } from "./+types/BrukerLayout";

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
            <Page.Block width="xl">
                <Outlet />
            </Page.Block>
        </VStack>
    );
}
