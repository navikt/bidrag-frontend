import type { Bidragssak } from "@bidrag/api/BidragReskontroApi";
import { PersonNavn } from "@bidrag/common";
import { BodyLong, Heading, VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hentInnkrevingssakPaPerson } from "~/api/query/reskontro.query.ts";
import { hentSakerForPerson } from "~/api/query/sak.query.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import { SakSummer } from "~/routes/bruker/sum_pr_sak/SakSummer.tsx";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel.tsx";
import type { Route } from "./+types/SumPrSakPage.ts";

export const handle: SakSideTittelHandle = { sakSideTittel: "Sum pr sak" };

export default function SumPrSakPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);

    const { data: saker } = useSuspenseQuery(hentSakerForPerson(fnr));
    const { data: innkrevingssak } = useSuspenseQuery(hentInnkrevingssakPaPerson(fnr));
    const bidragssakerMedDetaljer = innkrevingssak.bidragssaker ?? [];

    const finnBidragssak = (saksnummer: string): Bidragssak =>
        bidragssakerMedDetaljer.find((bidragssak) => bidragssak.saksnummer === saksnummer) ?? {
            saksnummer,
            barn: [],
        };

    const renderSaker = () => {
        if (saker.length === 0) {
            return <BodyLong>Ingen saker funnet </BodyLong>;
        }
        return (
            <>
                {saker.map((sak) => (
                    <SakSummer bidragSak={finnBidragssak(sak.saksnummer)} ident={fnr} key={sak.saksnummer} />
                ))}
            </>
        );
    };
    return (
        <VStack gap={"space-48"}>
            <title>Sum pr sak</title>
            <Heading size={"medium"}>
                Sum pr sak for <PersonNavn ident={fnr} />
            </Heading>
            {renderSaker()}
        </VStack>
    );
}
