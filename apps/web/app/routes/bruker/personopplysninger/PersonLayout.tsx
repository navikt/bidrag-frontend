import type { PersondetaljerDto } from "@bidrag/api/PersonApi";
import { useTilgangssjekkBruker } from "@bidrag/common";
import { CardIcon, ClockDashedIcon, PersonIcon } from "@navikt/aksel-icons";
import { HStack, Loader, Page, Tabs, VStack } from "@navikt/ds-react";
import { Link, Outlet, useOutletContext } from "react-router";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import { useHentPersoninformasjonDetaljer } from "~/common/person/usePersonInformation.ts";
import type { Route } from "./+types/PersonLayout";

type BrukerContextType = {
    ident: string;
    detaljer: PersondetaljerDto;
};

export function useBrukerContext() {
    return useOutletContext<BrukerContextType>();
}

export default function PersonLayout({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerid = params.brukerid;
    const ident = decodeFnr(brukerid);
    const { harTilgang, TilgangAlert } = useTilgangssjekkBruker(ident);
    const {
        personinformasjonDetaljer: detaljer,
        personinformasjonDetaljerError,
        isPersoninformasjonDetaljerLoading,
    } = useHentPersoninformasjonDetaljer({ ident }, harTilgang);

    if (!harTilgang && TilgangAlert)
        return (
            <Page.Block gutters>
                <VStack justify={"center"} margin={"space-64"}>
                    <TilgangAlert size={"medium"} />
                </VStack>
            </Page.Block>
        );

    if (personinformasjonDetaljerError) {
        return personinformasjonDetaljerError.message;
    }

    if (isPersoninformasjonDetaljerLoading || detaljer === undefined) {
        return (
            <HStack width={"100%"} marginBlock={"space-128"} align={"center"} justify={"center"}>
                <Loader size={"3xlarge"} />
            </HStack>
        );
    }

    return (
        <>
            <Tabs defaultValue={window.location.pathname.split("/").pop()}>
                <Tabs.List>
                    <Tabs.Tab
                        value="personalia"
                        label="Personalia"
                        as={Link}
                        to={`/bruker/${brukerid}/personalia`}
                        icon={<PersonIcon aria-hidden />}
                    />
                    <Tabs.Tab
                        value="historikk"
                        label="Historikk"
                        as={Link}
                        to={`/bruker/${brukerid}/historikk`}
                        icon={<ClockDashedIcon aria-hidden />}
                    />
                    <Tabs.Tab
                        value="kontoopplysninger"
                        label="Kontoopplysninger"
                        as={Link}
                        to={`/bruker/${brukerid}/kontoopplysninger`}
                        icon={<CardIcon aria-hidden />}
                    />
                </Tabs.List>
            </Tabs>
            <Page.Block width="2xl" style={{ flex: "1 1 auto", minWidth: 0 }}>
                <Outlet context={{ ident, detaljer } satisfies BrukerContextType} />
            </Page.Block>
        </>
    );
}
