import { MaskerSensitivInfo } from "@bidrag/common";
import { PersonIcon } from "@navikt/aksel-icons";
import { BodyLong, BodyShort, Box, Button, Heading, HGrid, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import type { Diskresjonskode, ForelderPartRolle } from "../opprett-sak-schema";
import { sakstypeTilTekst, useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { hentForelderRolleLabel } from "../utils";

type PartOppsummering = {
    rolle: ForelderPartRolle;
    ident?: string;
    navn?: string;
    fødselsdato?: string;
    erKjent?: boolean;
    diskresjonskode?: Diskresjonskode;
};

type BarnOppsummering = {
    ident: string;
    navn: string;
    diskresjonskode?: Diskresjonskode;
    reellMottakerType?: "ingen" | "barnet_selv" | "annen_person" | null;
    reellMottaker?: string | null;
    reellMottakerNavn?: string | null;
};

type Props = {
    bidragspliktig: PartOppsummering | null;
    bidragsmottaker: PartOppsummering | null;
    barn: BarnOppsummering[];
    partISakenRolle: ForelderPartRolle;
    hideMissingPartCards?: boolean;
    onSettBidragspliktigUkjent?: () => void;
    onSettBidragsmottakerUkjent?: () => void;
    onLeggTilBidragspliktig?: () => void;
    onLeggTilBidragsmottaker?: () => void;
};

export default function OppsummeringSection({
    bidragspliktig,
    bidragsmottaker,
    barn,
    partISakenRolle,
    hideMissingPartCards = false,
    onSettBidragspliktigUkjent,
    onSettBidragsmottakerUkjent,
    onLeggTilBidragspliktig,
    onLeggTilBidragsmottaker,
}: Props) {
    const { sakstype, sakskategori } = useSaksrolleroversikt();
    // Always show part i saken first (left), then motpart (right)
    const firstPart = partISakenRolle === "bidragspliktig" ? bidragspliktig : bidragsmottaker;
    const secondPart = partISakenRolle === "bidragspliktig" ? bidragsmottaker : bidragspliktig;
    const firstCallback = partISakenRolle === "bidragspliktig" ? undefined : onSettBidragsmottakerUkjent;
    const secondCallback =
        partISakenRolle === "bidragspliktig" ? onSettBidragsmottakerUkjent : onSettBidragspliktigUkjent;
    const firstAddCallback = partISakenRolle === "bidragspliktig" ? onLeggTilBidragspliktig : onLeggTilBidragsmottaker;
    const secondAddCallback = partISakenRolle === "bidragspliktig" ? onLeggTilBidragsmottaker : onLeggTilBidragspliktig;

    const partCards = [
        { key: "first", data: firstPart, callback: firstCallback, addCallback: firstAddCallback },
        { key: "second", data: secondPart, callback: secondCallback, addCallback: secondAddCallback },
    ].filter((item) => !hideMissingPartCards || item.data !== null);

    return (
        <VStack gap="space-4">
            <Heading level="2" size="large">
                Oppsummering
            </Heading>

            <Box
                asChild
                borderRadius="8"
                borderColor="neutral-subtleA"
                borderWidth="1"
                background="neutral-moderate"
                padding="space-16"
            >
                <dl>
                    <HGrid columns="max-content max-content" gap="space-4 space-8" align="start" width="fit-content">
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

            <HGrid columns={{ xs: 1, md: 2 }} gap="space-16">
                {partCards.map((item) => (
                    <PartKort
                        key={item.key}
                        data={item.data}
                        onSettUkjent={item.callback}
                        onLeggTil={item.addCallback}
                    />
                ))}
            </HGrid>

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
    );
}

type PartKortProps = {
    data: PartOppsummering | null;
    onSettUkjent?: () => void;
    onLeggTil?: () => void;
};

function PartKort({ data, onSettUkjent, onLeggTil }: PartKortProps) {
    if (!data) {
        return <Box borderRadius="8" background="neutral-moderate" padding="space-16" />;
    }

    const erUkjent = data.erKjent === false || !data.ident || !data.navn;

    return (
        <Box asChild borderRadius="8" background="neutral-moderate">
            <VStack gap="space-4" padding="space-16">
                <HStack align="center" gap="space-8">
                    <PersonIcon aria-hidden fontSize="1.5rem" className="text-ax-neutral-1000" />
                    <BodyLong size="small" weight="semibold" textColor="default">
                        {hentForelderRolleLabel(data.rolle)}
                    </BodyLong>
                </HStack>
                <MaskerSensitivInfo>
                    {erUkjent ? (
                        <HStack align="center" justify="space-between" gap="space-8">
                            <BodyLong size="small" textColor="subtle" className="italic">
                                Ukjent
                            </BodyLong>
                            {onLeggTil && (
                                <Button type="button" variant="tertiary" size="xsmall" onClick={onLeggTil}>
                                    Legg til {data.rolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker"}
                                </Button>
                            )}
                        </HStack>
                    ) : (
                        <VStack gap="space-1">
                            <PersonInfo ident={data.ident || ""} navn={data.navn} fødselsdato={data.fødselsdato} />
                            {data.diskresjonskode && <DiskresjonAlert diskresjonskode={data.diskresjonskode} />}
                        </VStack>
                    )}
                </MaskerSensitivInfo>
                {!erUkjent && onSettUkjent && (
                    <Box asChild borderColor="neutral-subtleA" borderWidth="1 0 0 0">
                        <HStack justify="end" paddingBlock="space-4 space-0">
                            <Button type="button" variant="tertiary" size="small" onClick={onSettUkjent}>
                                Sett {data.rolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker"} som ukjent
                            </Button>
                        </HStack>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}

type BarnKortProps = {
    barn: BarnOppsummering;
};

function BarnKort({ barn }: BarnKortProps) {
    const reellMottakerTekst = hentReellMottakerTekst(barn);

    return (
        <Box asChild borderRadius="8" background="neutral-moderate">
            <VStack gap="space-4" padding="space-16">
                <div>
                    <BodyShort size="small" weight="semibold" textColor="default">
                        Barn
                    </BodyShort>
                    <PersonInfo ident={barn.ident} navn={barn.navn} />
                    {barn.diskresjonskode && <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />}
                </div>

                <Box paddingBlock="space-8 space-0" borderColor="neutral-subtleA" borderWidth="1 0 0 0">
                    <div>
                        <BodyShort size="small" textColor="subtle">
                            Reell mottaker:
                        </BodyShort>
                        <BodyShort size="small" textColor="default">
                            {reellMottakerTekst}
                        </BodyShort>
                    </div>
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
