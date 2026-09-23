import { BodyShort, Box, Heading, HGrid, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import { type RollePerson, RollePersonGrid } from "../felles/RollePersonKort";
import type { Diskresjonskode, ForelderPartRolle } from "../opprett-sak-schema";
import { sakstypeTilTekst, useSaksrolleroversikt } from "../saksrolleroversiktContext";

type BarnOppsummering = {
    ident: string;
    navn: string;
    diskresjonskode?: Diskresjonskode;
    reellMottakerType?: "ingen" | "barnet_selv" | "annen_person" | null;
    reellMottaker?: string | null;
    reellMottakerNavn?: string | null;
};

type Props = {
    bidragspliktig: RollePerson | null;
    bidragsmottaker: RollePerson | null;
    barn: BarnOppsummering[];
    partISakenRolle: ForelderPartRolle;
    hideMissingPartCards?: boolean;
};

export default function OppsummeringSection({
    bidragspliktig,
    bidragsmottaker,
    barn,
    partISakenRolle,
    hideMissingPartCards = false,
}: Props) {
    const { sakstype, sakskategori } = useSaksrolleroversikt();
    const firstPart = partISakenRolle === "bidragspliktig" ? bidragspliktig : bidragsmottaker;
    const secondPart = partISakenRolle === "bidragspliktig" ? bidragsmottaker : bidragspliktig;

    return (
        <Box background="default" paddingBlock="space-24 space-0">
            <Box background="sunken">
                <VStack gap="space-4">
                    <Heading level="2" size="medium">
                        Oppsummering
                    </Heading>

                    <Box asChild borderRadius="8" background="raised" padding="space-16">
                        <dl>
                            <HGrid
                                columns="max-content max-content"
                                gap="space-4 space-8"
                                align="start"
                                width="fit-content"
                            >
                                <dt>
                                    <BodyShort size="small" textColor="subtle">
                                        Sakstype:
                                    </BodyShort>
                                </dt>
                                <Box asChild marginInline="space-0">
                                    <dd>
                                        <BodyShort size="small" weight="semibold" textColor="default">
                                            {sakstype ? sakstypeTilTekst(sakstype) : "Ikke valgt"}
                                        </BodyShort>
                                    </dd>
                                </Box>

                                <dt>
                                    <BodyShort size="small" textColor="subtle">
                                        Sakskategori:
                                    </BodyShort>
                                </dt>
                                <Box asChild marginInline="space-0">
                                    <dd>
                                        <BodyShort size="small" weight="semibold" textColor="default">
                                            {sakskategori}
                                        </BodyShort>
                                    </dd>
                                </Box>
                            </HGrid>
                        </dl>
                    </Box>

                    <RollePersonGrid personer={[firstPart, secondPart]} skjulManglende={hideMissingPartCards} />

                    {barn.length > 0 && (
                        <VStack gap="space-2">
                            <BodyShort size="small" weight="semibold" textColor="default">
                                Barn
                            </BodyShort>
                            <HGrid columns={{ xs: 1, md: 2 }} gap="space-16">
                                {barn.map((item) => (
                                    <BarnKort key={item.ident} barn={item} />
                                ))}
                            </HGrid>
                        </VStack>
                    )}
                </VStack>
            </Box>
        </Box>
    );
}

function BarnKort({ barn }: { barn: BarnOppsummering }) {
    return (
        <Box asChild borderRadius="8" background="raised">
            <VStack gap="space-4" padding="space-16">
                <VStack gap="space-1">
                    <BodyShort size="small" weight="semibold" textColor="default">
                        Barn
                    </BodyShort>
                    <PersonInfo ident={barn.ident} navn={barn.navn} />
                    {barn.diskresjonskode && <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />}
                </VStack>

                <Box paddingBlock="space-8 space-0" borderColor="neutral-subtleA" borderWidth="1 0 0 0">
                    <VStack gap="space-1">
                        <BodyShort size="small" textColor="subtle">
                            Reell mottaker:
                        </BodyShort>
                        <BodyShort size="small" textColor="default">
                            {hentReellMottakerTekst(barn)}
                        </BodyShort>
                    </VStack>
                </Box>
            </VStack>
        </Box>
    );
}

function hentReellMottakerTekst(barn: BarnOppsummering): string | ReactNode {
    if (barn.reellMottakerType === "barnet_selv") {
        return "Barnet selv";
    }

    if (barn.reellMottakerType === "annen_person") {
        return <PersonInfo ident={barn.reellMottaker ?? ""} navn={barn.reellMottakerNavn ?? undefined} />;
    }

    if (barn.reellMottakerType === "ingen") {
        return "Ingen";
    }

    return "Ikke valgt";
}
