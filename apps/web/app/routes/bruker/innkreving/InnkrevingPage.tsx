import { PersonNavn } from "@bidrag/common";
import { Heading, VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hentInnkrevingsinformasjonPaPerson } from "~/api/query/reskontro.query";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr";
import { InnkrevingsGjeldendeOrdning } from "~/routes/bruker/innkreving/InnkrevingsGjeldendeOrdning";
import { InnkrevingsHistorikk } from "~/routes/bruker/innkreving/InnkrevingsHistorikk";
import { InnkrevingsNyOrdning } from "~/routes/bruker/innkreving/InnkrevingsNyOrdning";
import { InnkrevingsToppseksjon } from "~/routes/bruker/innkreving/InnkrevingsToppseksjon";
import type { Route } from "./+types/InnkrevingPage";

export default function InnkrevingPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerid = params.brukerid;
    const ident = decodeFnr(brukerid);
    const { data } = useSuspenseQuery(hentInnkrevingsinformasjonPaPerson(ident));
    const documentTitle = `Innkreving - ${brukerid}`;

    return (
        <VStack gap="space-32">
            <title>{documentTitle}</title>
            <Heading size={"large"}>
                Innkreving for bruker <PersonNavn ident={ident} />
            </Heading>
            <InnkrevingsToppseksjon ident={ident} skyldnerinformasjon={data.skyldnerinformasjon} />
            <InnkrevingsGjeldendeOrdning gjeldendeBetalingsordning={data.gjeldendeBetalingsordning} />
            <InnkrevingsNyOrdning nyBetalingsordning={data.nyBetalingsordning} />
            <InnkrevingsHistorikk historikk={data.innkrevingssakshistorikk} />
        </VStack>
    );
}
