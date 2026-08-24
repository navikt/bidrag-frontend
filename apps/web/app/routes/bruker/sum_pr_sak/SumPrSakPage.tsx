import { VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hentInnkrevingssakPaPerson } from "~/api/query/reskontro.query.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import { SakSummer } from "~/routes/bruker/sum_pr_sak/SakSummer.tsx";
import type { Route } from "./+types/SumPrSakPage.ts";

export default function SumPrSakPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);

    const { data } = useSuspenseQuery(hentInnkrevingssakPaPerson(fnr));

    data.skyldner
    const saker = data.bidragssaker ?? [];

    return (
        <VStack gap={"space-48"}>
            {saker.map((sak) => (
                <SakSummer bidragSak={sak} ident={fnr} key={sak.saksnummer} />
            ))}
        </VStack>
    );
}
