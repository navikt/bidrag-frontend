import type { NyOpprettSakFlytProps } from "@bidrag/common";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { InlineMessage, VStack } from "@navikt/ds-react";
import { useMemo, useState } from "react";
import { useHentPersoninformasjon } from "~/api/useApi.ts";
import LasterSkeleton from "./components/LasterSkeleton";
import { tilPartRolle } from "./inngang";
import OpprettSakSkjema from "./OpprettSakSkjema";
import type { PartRolle } from "./opprett-sak-schema";
import StartpartVelger from "./StartpartVelger";

/**
 * Flyten slik behandling og dokument viser den i en modal. Saken er alltid barnebidrag, og
 * personen modalen åpnes for kan ikke byttes. Uten kjent rolle velger saksbehandleren rollen først.
 */
export default function OpprettSakFlytInnbygget({
    ident,
    rolle,
    initialForelder,
    eierfogd,
    onOpprettet,
    onAvbryt,
}: NyOpprettSakFlytProps) {
    const { data: person, error } = useHentPersoninformasjon({ ident });
    const [valgtRolle, setValgtRolle] = useState<PartRolle | null>(null);
    const inngang = useMemo(
        () => ({ ident, rolle, initialForelder, eierfogd }),
        [ident, rolle, initialForelder, eierfogd],
    );
    const startrolle = (person && tilPartRolle(rolle, beregnAlderForPerson(person))) ?? valgtRolle;
    const start = useMemo(
        () => (person && startrolle ? { person, rolle: startrolle, sakstype: "BARNEBIDRAG" as const } : null),
        [person, startrolle],
    );

    if (error) {
        return (
            <InlineMessage status="error">
                Kunne ikke hente personen saken skal opprettes for. Lukk vinduet og prøv igjen.
            </InlineMessage>
        );
    }
    if (!person) return <LasterSkeleton tekst="Henter person..." />;

    return (
        <VStack gap="space-24">
            {start ? (
                <OpprettSakSkjema
                    start={start}
                    låstIdent={ident}
                    inngang={inngang}
                    onOpprettet={onOpprettet}
                    onAvbryt={onAvbryt}
                />
            ) : (
                <StartpartVelger
                    sakstype="BARNEBIDRAG"
                    forhåndsvalgt={person}
                    visSøk={false}
                    harSkjema={false}
                    onBekreft={(_, valgt) => setValgtRolle(valgt)}
                />
            )}
        </VStack>
    );
}
