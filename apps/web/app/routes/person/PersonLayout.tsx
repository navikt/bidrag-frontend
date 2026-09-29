import { useTilgangssjekkBruker } from "@bidrag/common";
import { CardIcon, ClockDashedIcon, PersonIcon, TableIcon } from "@navikt/aksel-icons";
import { Bleed, Box, HStack, Loader, Page, Tabs, VStack } from "@navikt/ds-react";
import { Link, Outlet } from "react-router";
import { useHentPersoninformasjonDetaljer } from "~/api/useApi";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import type { Route } from "./+types/PersonLayout";
import { PersonHeader } from "./PersonHeader";

export default function PersonLayout({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const personId = params.personid;
    const ident = decodeFnr(personId);
    const { harTilgang, TilgangAlert } = useTilgangssjekkBruker(ident);
    const { data: bruker, isLoading, error } = useHentPersoninformasjonDetaljer({ ident }, harTilgang);

    const path = () => {
        switch (window.location.pathname.split("/").pop()) {
            case "historikk":
                return "historikk";
            case "personalia":
                return "personalia";
            case "kontoopplysninger":
                return "kontoopplysninger";
            default:
                return "oversikt";
        }
    };

    if (!harTilgang && TilgangAlert)
        return (
            <Page.Block gutters>
                <VStack justify={"center"} margin={"space-64"}>
                    <TilgangAlert size={"medium"} />
                </VStack>
            </Page.Block>
        );

    if (isLoading || bruker === undefined) {
        return (
            <HStack width={"100%"} marginBlock={"space-128"} align={"center"} justify={"center"}>
                <Loader size={"3xlarge"} />
            </HStack>
        );
    }

    if (error) {
        return error.message;
    }

    return (
        <Page.Block width="2xl" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <PersonHeader bruker={bruker} />
            <Tabs defaultValue={path()}>
                <Tabs.List>
                    <Tabs.Tab
                        as={Link}
                        value="oversikt"
                        label="Oversikt"
                        icon={<TableIcon aria-hidden />}
                        to={`/person/${personId}`}
                    />
                    <Tabs.Tab
                        value="historikk"
                        label="Historikk"
                        as={Link}
                        to={`/person/${personId}/historikk`}
                        icon={<ClockDashedIcon aria-hidden />}
                    />
                    <Tabs.Tab
                        value="personalia"
                        label="Personalia"
                        as={Link}
                        to={`/person/${personId}/personalia`}
                        icon={<PersonIcon aria-hidden />}
                    />
                    <Tabs.Tab
                        value="kontoopplysninger"
                        label="Kontoopplysninger"
                        as={Link}
                        to={`/person/${personId}/kontoopplysninger`}
                        icon={<CardIcon aria-hidden />}
                    />
                </Tabs.List>
            </Tabs>
            <Box background={"neutral-soft"} asChild height={"100vh"}>
                <Bleed marginInline="full">
                    <Page.Block width="2xl" style={{ flex: "1 1 auto", minWidth: 0 }}>
                        <Outlet />
                    </Page.Block>
                </Bleed>
            </Box>
        </Page.Block>
    );
}
