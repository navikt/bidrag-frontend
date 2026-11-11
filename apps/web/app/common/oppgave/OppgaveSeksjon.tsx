import type { FinnOppgaverRequest } from "@bidrag/api/BidragOppgaveApi";
import { InlineMessage, Loader, LocalAlert } from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";
import { useFlag } from "@unleash/proxy-client-react";
import { finnOppgaver } from "~/api/query/oppgave.query.ts";
import { OppgaveTabell } from "./OppgaveTabell.tsx";

/**
 * useQuery framfor useSuspenseQuery: useSuspenseQuery overser `enabled`, så flagget og et
 * manglende søkekriterium ville ikke stoppet kallet. En feil i oppgave-API-et skal dessuten
 * bare gi en melding i denne seksjonen, ikke velte hele siden.
 */
export function OppgaveSeksjon({ søk }: { søk: FinnOppgaverRequest }) {
    const oppgaverErPå = useFlag("frontend.oppgaver");
    const oppgaver = useQuery(finnOppgaver(søk, oppgaverErPå));

    if (!oppgaverErPå) {
        return <InlineMessage status="warning">Oppgaver er foreløpig ikke tilgjengelig for deg</InlineMessage>;
    }
    if (oppgaver.isError) {
        return (
            <LocalAlert status="error">
                <LocalAlert.Header>
                    <LocalAlert.Title>Kunne ikke hente oppgaver</LocalAlert.Title>
                </LocalAlert.Header>
                <LocalAlert.Content>{oppgaver.error.message}</LocalAlert.Content>
            </LocalAlert>
        );
    }
    if (!oppgaver.data) return <Loader title="Henter oppgaver" />;

    return <OppgaveTabell oppgaver={oppgaver.data} />;
}
