import { BodyShort, FormSummary, HStack, Tag } from "@navikt/ds-react";
import type { ReactNode } from "react";

import PersonInfo from "./components/PersonInfo.tsx";
import type { BarnRolle, SakRedigeringData } from "./sakvisning-schema.ts";

type NormalisertRolle = {
    key: string;
    rolleType: string;
    fodselsnummer: string;
    reellMottaker: string;
    reellMottakerNavn?: string;
};

type Endringsrad =
    | {
          id: string;
          type: "lagtTil";
          rolleType: string;
          ident: string;
      }
    | {
          id: string;
          type: "fjernet";
          rolleType: string;
          ident: string;
      }
    | {
          id: string;
          type: "endretReellMottaker";
          rolleType: string;
          ident: string;
          fraReellMottaker: string;
          tilReellMottaker: string;
          fraReellMottakerNavn?: string;
          tilReellMottakerNavn?: string;
      };

type Persongruppe = {
    personKey: string;
    ident: string;
    endringer: Endringsrad[];
};

type SakvisningEndringsoppsummeringProps = {
    opprinneligeRoller: SakRedigeringData["roller"];
    nåværendeRoller: SakRedigeringData["roller"];
};

function lagRolleSignatur(rolle: SakRedigeringData["roller"][number]): string {
    const rolleType = rolle.rolleType || rolle.type;
    const fodselsnummer = rolle.fodselsnummer || "";
    return `${rolleType}-${fodselsnummer || rolle.objektnummer || "mangler-ident"}`;
}

function normaliserRoller(roller: SakRedigeringData["roller"]): NormalisertRolle[] {
    const forekomstMap = new Map<string, number>();

    return roller.map((rolle) => {
        const signatur = lagRolleSignatur(rolle);
        const forekomst = (forekomstMap.get(signatur) || 0) + 1;
        forekomstMap.set(signatur, forekomst);

        const rolleType = rolle.rolleType || rolle.type;
        const fodselsnummer = rolle.fodselsnummer || "";
        return {
            key: `${signatur}-${forekomst}`,
            rolleType,
            fodselsnummer,
            reellMottaker: (rolle as BarnRolle).reellMottaker || "",
            reellMottakerNavn: (rolle as BarnRolle).reellMottakerNavn,
        };
    });
}

function erPersonIdent(ident: string): boolean {
    return /^\d{11}$/.test(ident);
}

function lagEndringsoppsummering(
    opprinneligeRoller: SakRedigeringData["roller"],
    nåværendeRoller: SakRedigeringData["roller"],
): Endringsrad[] {
    const opprinnelige = normaliserRoller(opprinneligeRoller);
    const nåværende = normaliserRoller(nåværendeRoller);

    const opprinneligeMap = new Map(opprinnelige.map((rolle) => [rolle.key, rolle]));
    const nåværendeMap = new Map(nåværende.map((rolle) => [rolle.key, rolle]));

    const lagtTil = nåværende
        .filter((rolle) => !opprinneligeMap.has(rolle.key))
        .map(
            (rolle): Endringsrad => ({
                id: `lagt-til-${rolle.key}`,
                type: "lagtTil",
                rolleType: rolle.rolleType,
                ident: rolle.fodselsnummer,
            }),
        );

    const fjernet = opprinnelige
        .filter((rolle) => !nåværendeMap.has(rolle.key))
        .map(
            (rolle): Endringsrad => ({
                id: `fjernet-${rolle.key}`,
                type: "fjernet",
                rolleType: rolle.rolleType,
                ident: rolle.fodselsnummer,
            }),
        );

    const endretReellMottaker = nåværende
        .filter((rolle) => opprinneligeMap.has(rolle.key) && rolle.rolleType === "BA")
        .flatMap((rolle) => {
            const opprinneligRolle = opprinneligeMap.get(rolle.key);
            if (!opprinneligRolle || opprinneligRolle.reellMottaker === rolle.reellMottaker) {
                return [];
            }

            const fra = opprinneligRolle.reellMottaker.trim() !== "" ? opprinneligRolle.reellMottaker : "ingen";
            const til = rolle.reellMottaker.trim() !== "" ? rolle.reellMottaker : "ingen";
            return [
                {
                    id: `reell-mottaker-${rolle.key}`,
                    type: "endretReellMottaker",
                    rolleType: rolle.rolleType,
                    ident: rolle.fodselsnummer,
                    fraReellMottaker: fra,
                    tilReellMottaker: til,
                    fraReellMottakerNavn: opprinneligRolle.reellMottakerNavn,
                    tilReellMottakerNavn: rolle.reellMottakerNavn,
                } satisfies Endringsrad,
            ];
        });

    return [...lagtTil, ...fjernet, ...endretReellMottaker];
}

export function harEndringer(
    opprinneligeRoller: SakRedigeringData["roller"],
    nåværendeRoller: SakRedigeringData["roller"],
): boolean {
    return lagEndringsoppsummering(opprinneligeRoller, nåværendeRoller).length > 0;
}

function grupperEtterPerson(endringer: Endringsrad[]): Persongruppe[] {
    const grupper = new Map<string, Persongruppe>();

    endringer.forEach((endring) => {
        const ident = endring.ident.trim();
        const personKey = ident !== "" ? ident : "ukjent-ident";

        const eksisterende = grupper.get(personKey);
        if (eksisterende) {
            eksisterende.endringer.push(endring);
            return;
        }

        grupper.set(personKey, {
            personKey,
            ident,
            endringer: [endring],
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
        return <PersonInfo navn={mottakerNavn} ident={trimmetMottakerIdent} />;
    }

    if (erPersonIdent(trimmetMottakerIdent)) {
        return <PersonInfo ident={trimmetMottakerIdent} />;
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
                <PersonInfo ident={gruppe.ident} />
                {harLagtTilRolle && (
                    <Tag size="xsmall" variant="alt1">
                        Ny rolle
                    </Tag>
                )}
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

export default function Endringsoppsummering({
    opprinneligeRoller,
    nåværendeRoller,
}: SakvisningEndringsoppsummeringProps) {
    const endringer = lagEndringsoppsummering(opprinneligeRoller, nåværendeRoller);
    const grupperteEndringer = grupperEtterPerson(endringer);

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
