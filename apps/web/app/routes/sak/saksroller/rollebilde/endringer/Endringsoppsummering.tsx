import { BodyShort, FormSummary, HStack, Tag } from "@navikt/ds-react";
import type { ReactNode } from "react";

import PersonInfo from "../../felles/person/PersonInfo.tsx";
import type { Endringsrad } from "./endringsoppsummering-utils.ts";

type Persongruppe = {
    personKey: string;
    ident: string;
    endringer: Endringsrad[];
    harUfullstendigRelasjon: boolean;
};

type SakvisningEndringsoppsummeringProps = {
    endringsliste: Endringsrad[];
};

function erPersonIdent(ident: string): boolean {
    return /^\d{11}$/.test(ident);
}

function grupperEtterPerson(endringer: Endringsrad[]): Persongruppe[] {
    const grupper = new Map<string, Persongruppe>();

    endringer.forEach((endring) => {
        const ident = endring.ident.trim();
        const personKey = ident !== "" ? ident : "ukjent-ident";

        const eksisterende = grupper.get(personKey);
        if (eksisterende) {
            eksisterende.endringer.push(endring);
            eksisterende.harUfullstendigRelasjon =
                eksisterende.harUfullstendigRelasjon || endring.harUfullstendigRelasjon;
            return;
        }

        grupper.set(personKey, {
            personKey,
            ident,
            endringer: [endring],
            harUfullstendigRelasjon: endring.harUfullstendigRelasjon,
        });
    });

    return Array.from(grupper.values()).sort((a, b) => a.personKey.localeCompare(b.personKey));
}

function renderReellMottaker(identBarn: string, mottakerIdent: string, mottakerNavn?: string) {
    const trimmetMottakerIdent = mottakerIdent.trim();

    if (trimmetMottakerIdent === "" || trimmetMottakerIdent === "ingen") {
        return "Ingen";
    }

    if (trimmetMottakerIdent === identBarn.trim()) {
        return "Barnet selv";
    }

    if (mottakerNavn && mottakerNavn.trim() !== "") {
        return <PersonInfo navn={mottakerNavn} ident={trimmetMottakerIdent} compact visKopieringsknapp={false} />;
    }

    if (erPersonIdent(trimmetMottakerIdent)) {
        return <PersonInfo ident={trimmetMottakerIdent} compact visKopieringsknapp={false} />;
    }

    return trimmetMottakerIdent;
}

function ReellMottakerRad({ etikett, verdi }: { etikett: string; verdi: ReactNode }) {
    return (
        <FormSummary.Value>
            <HStack gap="space-8" align="start">
                <BodyShort size="small" textColor="subtle">
                    {etikett}
                </BodyShort>
                {verdi}
            </HStack>
        </FormSummary.Value>
    );
}

function ReellMottakerDetaljer({ endring }: { endring: Extract<Endringsrad, { type: "endretReellMottaker" }> }) {
    return (
        <>
            <ReellMottakerRad
                etikett="Fra:"
                verdi={renderReellMottaker(endring.ident, endring.fraReellMottaker, endring.fraReellMottakerNavn)}
            />
            <ReellMottakerRad
                etikett="Til:"
                verdi={renderReellMottaker(endring.ident, endring.tilReellMottaker, endring.tilReellMottakerNavn)}
            />
        </>
    );
}

function reellMottakerStatus(endring: Extract<Endringsrad, { type: "endretReellMottaker" }>): string {
    const fraTom = endring.fraReellMottaker.trim() === "" || endring.fraReellMottaker === "ingen";
    const tilTom = endring.tilReellMottaker.trim() === "" || endring.tilReellMottaker === "ingen";

    if (fraTom) return "Lagt til reell mottaker";
    if (tilTom) return "Fjernet reell mottaker";
    return "Endret reell mottaker";
}

function EndringsRadSvar({ endring }: { endring: Exclude<Endringsrad, { type: "lagtTil" }> }) {
    if (endring.type === "fjernet") {
        return (
            <FormSummary.Answer key={endring.id}>
                <FormSummary.Label>Fjernet rolle</FormSummary.Label>
                <FormSummary.Value>
                    <BodyShort size="small">{endring.rolleType}</BodyShort>
                </FormSummary.Value>
            </FormSummary.Answer>
        );
    }

    return (
        <FormSummary.Answer key={endring.id}>
            <FormSummary.Label>{reellMottakerStatus(endring)}</FormSummary.Label>
            <ReellMottakerDetaljer endring={endring} />
        </FormSummary.Answer>
    );
}

function PersonEndringerSvar({ gruppe }: { gruppe: Persongruppe }) {
    const harLagtTilRolle = gruppe.endringer.some((endring) => endring.type === "lagtTil");
    const øvrigeEndringer = gruppe.endringer.filter(
        (endring): endring is Exclude<Endringsrad, { type: "lagtTil" }> => endring.type !== "lagtTil",
    );

    return (
        <FormSummary.Answer key={gruppe.personKey}>
            <FormSummary.Label>
                <HStack gap="space-4" align="center" wrap>
                    <PersonInfo ident={gruppe.ident} compact visKopieringsknapp={false} />
                    {harLagtTilRolle && (
                        <Tag size="xsmall" variant="alt1">
                            Ny rolle
                        </Tag>
                    )}
                    {gruppe.harUfullstendigRelasjon && (
                        <Tag size="xsmall" variant="warning">
                            Ufullstendig relasjon
                        </Tag>
                    )}
                </HStack>
            </FormSummary.Label>
            {øvrigeEndringer.length > 0 && (
                <FormSummary.Value>
                    <FormSummary.Answers>
                        {øvrigeEndringer.map((endring) => (
                            <EndringsRadSvar key={endring.id} endring={endring} />
                        ))}
                    </FormSummary.Answers>
                </FormSummary.Value>
            )}
        </FormSummary.Answer>
    );
}

export default function Endringsoppsummering({ endringsliste }: SakvisningEndringsoppsummeringProps) {
    const grupperteEndringer = grupperEtterPerson(endringsliste);

    if (grupperteEndringer.length === 0) {
        return null;
    }

    return (
        <FormSummary>
            <FormSummary.Header>
                <FormSummary.Heading level="2">Oppsummering av endringer</FormSummary.Heading>
            </FormSummary.Header>
            <FormSummary.Answers>
                {grupperteEndringer.map((gruppe) => (
                    <PersonEndringerSvar key={gruppe.personKey} gruppe={gruppe} />
                ))}
            </FormSummary.Answers>
        </FormSummary>
    );
}
