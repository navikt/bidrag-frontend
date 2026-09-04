import { PersonNavn } from "@bidrag/common";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import { Heading, InfoCard, VStack } from "@navikt/ds-react";
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
    const { skyldnerinformasjon, gjeldendeBetalingsordning, innkrevingssakshistorikk, nyBetalingsordning } = data;
    const documentTitle = `Innkreving - ${brukerid}`;

    const renderContent = () => {
        if (!skyldnerinformasjon && !gjeldendeBetalingsordning && innkrevingssakshistorikk?.length === 0) {
            return (
                <InfoCard data-color="info">
                    <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                        Ingen innkrevingsinformasjon funnet hos Skatteetaten for bruker
                    </InfoCard.Message>
                </InfoCard>
            );
        }
        return (
            <>
                <InnkrevingsToppseksjon ident={ident} skyldnerinformasjon={skyldnerinformasjon} />
                <InnkrevingsGjeldendeOrdning gjeldendeBetalingsordning={gjeldendeBetalingsordning} />
                <InnkrevingsNyOrdning nyBetalingsordning={nyBetalingsordning} />
                <InnkrevingsHistorikk historikk={innkrevingssakshistorikk} />
            </>
        );
    };
    return (
        <VStack gap="space-32">
            <title>{documentTitle}</title>
            <Heading size={"large"}>
                Innkreving for bruker <PersonNavn ident={ident} />
            </Heading>

            {renderContent()}
        </VStack>
    );
}
