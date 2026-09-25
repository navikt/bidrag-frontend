import { BodyShort, Heading, HGrid, HStack, Label, Tag, VStack } from "@navikt/ds-react";
import { useWatch } from "react-hook-form";
import PersonInfo from "../../components/PersonInfo";
import type { Diskresjonskode } from "../../sakvisning-schema";
import { hentDiskresjonskodeForklaring } from "../../utils";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "../felles/SkjemaSeksjon";
import { type Sakskategori, sakstypeTilTekst, useSaksrolleroversikt } from "../saksrolleroversiktContext";

type Person = { ident?: string; navn?: string; diskresjonskode?: string };
type Barn = Person & {
    ident: string;
    reellMottakerType?: string | null;
    reellMottaker?: string;
    reellMottakerNavn?: string;
};

export type OppsummeringParter = {
    bidragspliktig?: Person | null;
    bidragsmottaker?: Person | null;
    barn: Barn[];
};

/**
 * Viser det som blir lagret, bygd fra de samme partene som requesten.
 * Lik for alle sakstyper. Ukjent BP/BM lagres som ukjent part i bidrag-sak.
 */
export default function Oppsummering({ bidragspliktig, bidragsmottaker, barn }: OppsummeringParter) {
    const { sakstype } = useSaksrolleroversikt();
    const sakskategori = useWatch<{ kategori: Sakskategori }, "kategori">({ name: "kategori" });
    const sakTekst = sakstypeTilTekst(sakstype);

    return (
        <SkjemaSeksjon tittel="Oppsummering">
            <HGrid columns={{ xs: 1, sm: 2, lg: 3 }} gap="space-16">
                <Felt label="Sak">
                    <BodyShort size="small">{sakTekst}</BodyShort>
                    {sakskategori && (
                        <BodyShort size="small" textColor="subtle">
                            {sakskategori}
                        </BodyShort>
                    )}
                </Felt>
                <Felt label="Bidragspliktig">
                    <PersonVerdi person={bidragspliktig} />
                </Felt>
                <Felt label="Bidragsmottaker">
                    <PersonVerdi person={bidragsmottaker} />
                </Felt>
            </HGrid>
            {barn.length > 0 && (
                <VStack gap="space-8">
                    <Heading level="3" size="xsmall">
                        Barn
                    </Heading>
                    <HGrid columns="repeat(auto-fill, minmax(min(16rem, 100%), 1fr))" gap="space-16">
                        {barn.map((b) => (
                            <Felt key={b.ident}>
                                <PersonVerdi person={b} />
                                <BodyShort size="small" textColor="subtle">
                                    Reell mottaker: {reellMottakerTekst(b)}
                                </BodyShort>
                            </Felt>
                        ))}
                    </HGrid>
                </VStack>
            )}
        </SkjemaSeksjon>
    );
}

function Felt({ label, children }: { label?: string; children: React.ReactNode }) {
    return (
        <SkjemaSeksjonKort>
            <VStack gap="space-4" minWidth="0">
                {label && <Label size="small">{label}</Label>}
                {children}
            </VStack>
        </SkjemaSeksjonKort>
    );
}

function PersonVerdi({ person }: { person?: Person | null }) {
    if (!person?.ident?.trim()) {
        return <>Ukjent</>;
    }
    return (
        <HStack gap="space-8" wrap align="center">
            <PersonInfo ident={person.ident} navn={person.navn} compact visKopieringsknapp={false} />
            {person.diskresjonskode && (
                <Tag size="xsmall" variant="warning">
                    {hentDiskresjonskodeForklaring(person.diskresjonskode as Diskresjonskode)}
                </Tag>
            )}
        </HStack>
    );
}

function reellMottakerTekst(barn: Barn) {
    if (barn.reellMottakerType === "barnet_selv") return "Barnet selv";
    if (barn.reellMottakerType === "annen_person" && barn.reellMottaker) {
        return barn.reellMottakerNavn ? `${barn.reellMottakerNavn} (${barn.reellMottaker})` : barn.reellMottaker;
    }
    return "Bidragsmottaker";
}
