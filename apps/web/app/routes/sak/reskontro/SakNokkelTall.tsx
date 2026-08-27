import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop } from "@bidrag/utils/belopUtils";
import { Box, HStack, Label, Link, Table, VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hentInnkrevingForSaksnummer } from "~/api/query/reskontro.query";
import { useHentSak } from "~/api/useApi.ts";
import { medReturMål } from "~/common/navigation/returLink.ts";
import { ObfuscateFnrLink } from "~/common/person/ObfuscateFnrLink.tsx";
import {
    beregnBarnGjeld,
    beregnBarnTilUtbetaling,
    beregnBmGjeld,
    beregnTotalGjeld,
    beregnTotalOffentligGjeld,
    beregnTotalPrivatGjeld,
    beregnTotaltTilUtbetaling,
} from "~/common/reskontro/gjeldsberegninger.ts";
import { DUMMY_BARN } from "~/common/reskontro/konstanter.ts";

interface SakNokkelTallProps {
    saksnummer: string;
}

export function SakNokkelTall({ saksnummer }: SakNokkelTallProps) {
    const { data } = useSuspenseQuery(hentInnkrevingForSaksnummer(saksnummer));
    const { data: sak } = useHentSak(saksnummer);

    /**ELIN returnerer noen ganger et "ekstra" barn med fødselsnr 444444 44441. */

    const barn = data?.barn?.filter((barn) => barn.personident !== DUMMY_BARN) ?? [];
    const totalGjeld = beregnTotalGjeld(barn);
    const totalPrivatGjeld = beregnTotalPrivatGjeld(barn);
    const totalOffGjeld = beregnTotalOffentligGjeld(barn);
    const totaltTilUtbetaling = beregnTotaltTilUtbetaling(barn);
    const bmGjeld = beregnBmGjeld(data?.bmGjeldRest, data?.bmGjeldFastsettelsesgebyr);

    const bpFnr = sak?.roller.find((rolle) => rolle.type === "BP")?.fodselsnummer;
    const bmFnr = sak?.roller.find((rolle) => rolle.type === "BM")?.fodselsnummer;

    const BPNokkelTall = () => (
        <VStack gap={"space-16"}>
            <HStack gap={"space-8"} justify={"space-between"}>
                <Label>BPs gjeld i sak</Label>

                {bpFnr && (
                    <Link
                        as={ObfuscateFnrLink}
                        to={medReturMål(`/bruker/${bpFnr}/reskontro`, "saksreskontro", undefined, {
                            saksnummer,
                        })}
                    >
                        BPs brukerreskontro
                    </Link>
                )}
            </HStack>
            <Box
                asChild
                background={"default"}
                borderColor="neutral-subtle"
                padding="space-16"
                borderWidth="1"
                borderRadius="4"
            >
                <Table size="small">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Barn</Table.HeaderCell>
                            <Table.HeaderCell align={"right"}>Total gjeld</Table.HeaderCell>
                            <Table.HeaderCell align={"right"}>Privat gjeld</Table.HeaderCell>
                            <Table.HeaderCell align={"right"}>Offentlig gjeld</Table.HeaderCell>
                            <Table.HeaderCell align={"right"}>Til utbetaling</Table.HeaderCell>
                            <Table.HeaderCell align={"center"}>Utbetaling stoppet</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {barn.map((b) => (
                            <Table.Row key={b.personident}>
                                <Table.DataCell>
                                    <PersonNavnIdent ident={b.personident} bareFornavn />
                                </Table.DataCell>
                                <Table.DataCell align={"right"}>{formaterBelop(beregnBarnGjeld(b))}</Table.DataCell>
                                <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldPrivat)}</Table.DataCell>
                                <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldOffentlig)}</Table.DataCell>
                                <Table.DataCell align={"right"}>
                                    {formaterBelop(beregnBarnTilUtbetaling(b))}
                                </Table.DataCell>
                                <Table.DataCell align={"center"}>{b.erStoppIUtbetaling ? "Ja" : "-"}</Table.DataCell>
                            </Table.Row>
                        ))}
                        <Table.Row>
                            <Table.DataCell />
                            <Table.DataCell align={"right"}>
                                <strong>{formaterBelop(totalGjeld)}</strong>
                            </Table.DataCell>
                            <Table.DataCell align={"right"}>
                                <strong>{formaterBelop(totalPrivatGjeld)}</strong>
                            </Table.DataCell>
                            <Table.DataCell align={"right"}>
                                <strong>{formaterBelop(totalOffGjeld)}</strong>
                            </Table.DataCell>
                            <Table.DataCell align={"right"}>
                                <strong>{formaterBelop(totaltTilUtbetaling)}</strong>
                            </Table.DataCell>
                            <Table.DataCell />
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );

    const BMNokkelTall = () => (
        <VStack gap={"space-16"}>
            <HStack gap={"space-8"} justify={"space-between"}>
                <Label>BMs gjeld i sak</Label>

                {bmFnr && (
                    <Link
                        as={ObfuscateFnrLink}
                        to={medReturMål(`/bruker/${bmFnr}/reskontro`, "saksreskontro", undefined, {
                            saksnummer,
                        })}
                    >
                        BMs brukerreskontro
                    </Link>
                )}
            </HStack>
            <Box
                asChild
                background={"default"}
                borderColor="neutral-subtle"
                padding="space-16"
                borderWidth="1"
                borderRadius="4"
                width={"fit-content"}
            >
                <Table size="small">
                    <Table.Body>
                        <Table.Row>
                            <Table.DataCell>Gebyr</Table.DataCell>
                            <Table.DataCell align={"right"}>
                                {formaterBelop(data.bmGjeldFastsettelsesgebyr)}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.DataCell>Tilbakekrevingsbeløp</Table.DataCell>
                            <Table.DataCell align={"right"}>{formaterBelop(data.bmGjeldRest)}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.DataCell />
                            <Table.DataCell align={"right"}>
                                <strong>{formaterBelop(bmGjeld)}</strong>
                            </Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );

    return (
        <Box
            borderColor="neutral-subtle"
            background={"neutral-soft"}
            padding="space-16"
            borderWidth="1"
            borderRadius="4"
        >
            <VStack gap={"space-48"}>
                <BPNokkelTall />
                <BMNokkelTall />
            </VStack>
        </Box>
    );
}
