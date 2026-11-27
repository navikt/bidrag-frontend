import { BodyLong, LocalAlert } from "@navikt/ds-react";
import BekreftAdvarsel from "../bekreftelse/BekreftAdvarsel.tsx";
import type { Relasjonsregler } from "./useRelasjonsregler.ts";

const ANNEN_FORELDER_TITTEL = "Annen forelder i Folkeregisteret";

export default function Relasjonsmeldinger({
    regler,
    ufullstendigeNavn,
    annenForelderNavn,
    skjultForelderNavn = [],
    handling,
}: {
    regler: Relasjonsregler;
    ufullstendigeNavn: string[];
    annenForelderNavn: string[];
    skjultForelderNavn?: string[];
    handling: "opprettes" | "lagres";
}) {
    const annenForelderTekst = `${annenForelderNavn.join(", ")} har en annen forelder i Folkeregisteret enn den som er valgt.`;
    return (
        <>
            {regler.harInnloggingsfeil ? (
                <LocalAlert status="error" size="small" as="div">
                    <LocalAlert.Header>
                        <LocalAlert.Title>Innloggingen er ikke gyldig</LocalAlert.Title>
                    </LocalAlert.Header>
                    <LocalAlert.Content>
                        <BodyLong size="small">Last siden på nytt, eller logg inn igjen før du fortsetter.</BodyLong>
                    </LocalAlert.Content>
                </LocalAlert>
            ) : (
                regler.harOppslagsfeil && (
                    <LocalAlert status="error" size="small" as="div">
                        <LocalAlert.Header>
                            <LocalAlert.Title>Kunne ikke kontrollere relasjonene</LocalAlert.Title>
                        </LocalAlert.Header>
                        <LocalAlert.Content>
                            <BodyLong size="small">
                                Vi fikk ikke kontrollert relasjonene mellom barna og foreldrene. Prøv igjen senere.
                            </BodyLong>
                        </LocalAlert.Content>
                    </LocalAlert>
                )
            )}
            {regler.annenForelderStopper && (
                <LocalAlert status="error" size="small" as="div">
                    <LocalAlert.Header>
                        <LocalAlert.Title>{ANNEN_FORELDER_TITTEL}</LocalAlert.Title>
                    </LocalAlert.Header>
                    <LocalAlert.Content>
                        <BodyLong size="small">
                            {annenForelderTekst} Saken kan ikke {handling}.
                        </BodyLong>
                    </LocalAlert.Content>
                </LocalAlert>
            )}
            <BekreftAdvarsel
                tittel={ANNEN_FORELDER_TITTEL}
                bekreftTekst="Jeg har kontrollert at foreldrene er riktige"
                feilmelding="Du må bekrefte at du har kontrollert foreldrene"
                bekreftelse={regler.annenForelderBekreftelse}
            >
                {annenForelderTekst}
            </BekreftAdvarsel>
            <BekreftAdvarsel
                tittel="Forelder kan ikke vises"
                bekreftTekst="Jeg forstår at saken må behandles av en enhet som har tilgang"
                feilmelding="Du må bekrefte at saken kan flyttes til en annen enhet"
                bekreftelse={regler.skjultForelderBekreftelse}
            >
                {skjultForelderNavn.join(", ")} har en forelder du ikke har tilgang til. Det kan skyldes at forelderen
                er egen ansatt eller har fortrolig adresse. Saken må behandles av en enhet som har tilgang, og du kan
                miste tilgang til saken.
            </BekreftAdvarsel>
            <BekreftAdvarsel
                tittel="Ufullstendig relasjon"
                bekreftTekst="Jeg har kontrollert relasjonen mellom barna og foreldrene"
                feilmelding="Du må bekrefte at du har kontrollert relasjonene"
                bekreftelse={regler.relasjonsbekreftelse}
            >
                {ufullstendigeNavn.join(", ")} har manglende eller ufullstendig relasjon til partene.
            </BekreftAdvarsel>
        </>
    );
}
