import { formaterDato } from "@bidrag/utils";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import {
    BodyShort,
    Heading,
    HStack,
    InlineMessage,
    Link,
    Loader,
    LocalAlert,
    type SortState,
    Table,
    Tag,
    VStack,
} from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { hentHenvendelserForPerson } from "~/api/query/henvendelse.query.ts";
import { hentKodeverk } from "~/api/query/kodeverk.query.ts";
import modiaIkonUrl from "~/assets/modia_ikon_16x16.jpg";
import { modiaLenke, STANDARD_SORTERING, sorterHenvendelser, tilHenvendelseRader } from "./henvendelseUtils.ts";

/**
 * Henter dataene selv med useQuery framfor useSuspenseQuery: en feil i henvendelsesløsningen
 * skal bare gi en melding i denne seksjonen, ikke velte hele brukeroversikten.
 */
export function HenvendelseSeksjon({ ident }: { ident: string }) {
    const henvendelser = useQuery(hentHenvendelserForPerson(ident));
    // Kodeverket er pynt: feiler det, vises kodene i stedet for navnene.
    const temaer = useQuery(hentKodeverk("Tema"));
    const temagrupper = useQuery(hentKodeverk("Temagrupper"));

    const antall = henvendelser.data?.henvendelser.length;

    return (
        <VStack gap="space-16">
            <HStack gap="space-8" align="center">
                <Heading size="small" level="2">
                    Henvendelser
                </Heading>
                {antall !== undefined && (
                    <Tag variant="strong" data-color="neutral" size="xsmall" aria-label={`${antall} henvendelser`}>
                        {antall}
                    </Tag>
                )}
            </HStack>
            <InlineMessage status="info" size="small">
                Bruker kan ha flere henvendelser i{" "}
                <Link href={modiaLenke(ident)} target="_blank" rel="noopener noreferrer">
                    Modia
                    <ExternalLinkIcon title="Åpnes i ny fane" />
                </Link>
            </InlineMessage>
            {henvendelser.isPending ? (
                <Loader title="Henter henvendelser" />
            ) : henvendelser.isError ? (
                <LocalAlert status="error">
                    <LocalAlert.Header>
                        <LocalAlert.Title>Kunne ikke hente henvendelser</LocalAlert.Title>
                    </LocalAlert.Header>
                    <LocalAlert.Content>{henvendelser.error.message}</LocalAlert.Content>
                </LocalAlert>
            ) : (
                <>
                    {henvendelser.data.avkortet && (
                        <InlineMessage status="warning" size="small">
                            Bruker har flere henvendelser enn vi viser her. Se alle i Modia.
                        </InlineMessage>
                    )}
                    <HenvendelseTabell
                        ident={ident}
                        rader={tilHenvendelseRader(henvendelser.data.henvendelser, temaer.data, temagrupper.data)}
                    />
                </>
            )}
        </VStack>
    );
}

function HenvendelseTabell({ ident, rader }: { ident: string; rader: ReturnType<typeof tilHenvendelseRader> }) {
    const [sort, setSort] = useState<SortState>(STANDARD_SORTERING);
    const sorterteRader = useMemo(() => sorterHenvendelser(rader, sort), [rader, sort]);

    if (rader.length === 0) {
        return <BodyShort>Det finnes ingen henvendelser for denne personen.</BodyShort>;
    }

    const handleSortChange = (sortKey: string) =>
        setSort((forrige) => ({
            orderBy: sortKey,
            direction: forrige.orderBy === sortKey && forrige.direction === "ascending" ? "descending" : "ascending",
        }));

    return (
        <Table size="small" zebraStripes sort={sort} onSortChange={handleSortChange}>
            <caption className="sr-only">Henvendelser</caption>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Se henvendelse</Table.ColumnHeader>
                    <Table.ColumnHeader sortable sortKey="sisteMeldingSendt">
                        Siste dato
                    </Table.ColumnHeader>
                    <Table.ColumnHeader sortable sortKey="temagruppe">
                        Temagruppe
                    </Table.ColumnHeader>
                    <Table.ColumnHeader sortable sortKey="tema">
                        Tema
                    </Table.ColumnHeader>
                    <Table.ColumnHeader sortable sortKey="henvendelsestype">
                        Henvendelsestype
                    </Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {sorterteRader.map((rad) => (
                    <Table.Row key={rad.kjedeId}>
                        <Table.DataCell>
                            <a
                                href={modiaLenke(ident, rad.kjedeId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Åpne henvendelsen i Modia"
                            >
                                <img src={modiaIkonUrl} alt="Åpne henvendelsen i Modia" width={16} height={16} />
                            </a>
                        </Table.DataCell>
                        <Table.DataCell>{formaterDato(rad.sisteMeldingSendt)}</Table.DataCell>
                        <Table.DataCell>{rad.temagruppe}</Table.DataCell>
                        <Table.DataCell>{rad.tema}</Table.DataCell>
                        <Table.DataCell>
                            <Tag variant="neutral" size="small">
                                {rad.henvendelsestype}
                            </Tag>
                        </Table.DataCell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}
