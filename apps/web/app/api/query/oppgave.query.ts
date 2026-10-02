import { BIDRAG_OPPGAVE_API } from "@bidrag/api";
import type { BidragOppgaveDto, FinnOppgaverRequest } from "@bidrag/api/BidragOppgaveApi";
import { withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";

export function finnOppgaver(request: FinnOppgaverRequest) {
    return queryOptions({
        queryKey: ["finnOppgaver", request],
        queryFn: () =>
            withQueryErrorHandlingV2<BidragOppgaveDto[]>("finnOppgaver", async () => {
                const { data } = await BIDRAG_OPPGAVE_API.api.finnOppgaver(request);
                return data;
            }),
        enabled: !!request.aktoerId || !!request.saksnummer,
    });
}
