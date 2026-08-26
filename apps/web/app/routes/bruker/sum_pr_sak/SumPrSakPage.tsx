import { VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hentInnkrevingssakPaPerson } from "~/api/query/reskontro.query.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import { SakSummer } from "~/routes/bruker/sum_pr_sak/SakSummer.tsx";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel.tsx";
import type { Route } from "./+types/SumPrSakPage.ts";

export const handle: SakSideTittelHandle = { sakSideTittel: "Sum pr sak" };

export default function SumPrSakPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);

    const { data } = useSuspenseQuery(hentInnkrevingssakPaPerson(fnr));
    const saker = data.bidragssaker ?? [];

    return (
        <VStack gap={"space-48"}>
            <title>Sum pr sak</title>
            {saker.map((sak) => (
                <SakSummer bidragSak={sak} ident={fnr} key={sak.saksnummer} />
            ))}
        </VStack>
    );
}
