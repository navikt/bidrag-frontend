import { BodyShort, FormSummary, VStack } from "@navikt/ds-react";
import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import type { Diskresjonskode } from "../opprett-sak-schema";
import { sakstypeTilTekst, useSaksrolleroversikt } from "../saksrolleroversiktContext";

type Person = { ident?: string; navn?: string; diskresjonskode?: Diskresjonskode | string };
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
    const { sakstype, sakskategori } = useSaksrolleroversikt();

    return (
        <FormSummary>
            <FormSummary.Header>
                <FormSummary.Heading level="2">Oppsummering</FormSummary.Heading>
            </FormSummary.Header>
            <FormSummary.Answers>
                <Rad label="Sakstype">{sakstype ? sakstypeTilTekst(sakstype) : "Ikke valgt"}</Rad>
                <Rad label="Sakskategori">{sakskategori}</Rad>
                <Rad label="Bidragspliktig">
                    <PersonVerdi person={bidragspliktig} />
                </Rad>
                <Rad label="Bidragsmottaker">
                    <PersonVerdi person={bidragsmottaker} />
                </Rad>
                {barn.map((b) => (
                    <Rad key={b.ident} label="Barn">
                        <VStack gap="space-4">
                            <PersonVerdi person={b} />
                            <BodyShort size="small" textColor="subtle">
                                Reell mottaker: {reellMottakerTekst(b)}
                            </BodyShort>
                        </VStack>
                    </Rad>
                ))}
            </FormSummary.Answers>
        </FormSummary>
    );
}

function Rad({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <FormSummary.Answer>
            <FormSummary.Label>{label}</FormSummary.Label>
            <FormSummary.Value>{children}</FormSummary.Value>
        </FormSummary.Answer>
    );
}

function PersonVerdi({ person }: { person?: Person | null }) {
    if (!person?.ident?.trim()) {
        return <>Ukjent</>;
    }
    return (
        <VStack gap="space-4">
            <PersonInfo ident={person.ident} navn={person.navn} compact visKopieringsknapp={false} />
            {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode as Diskresjonskode} />}
        </VStack>
    );
}

function reellMottakerTekst(barn: Barn) {
    if (barn.reellMottakerType === "barnet_selv") return "Barnet selv";
    if (barn.reellMottakerType === "annen_person" && barn.reellMottaker) {
        return barn.reellMottakerNavn ? `${barn.reellMottakerNavn} (${barn.reellMottaker})` : barn.reellMottaker;
    }
    return "Bidragsmottaker";
}
