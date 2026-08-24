import type { Bidragssak, SaksinformasjonBarn } from "@bidrag/api/BidragReskontroApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop, sumNullable } from "@bidrag/utils";
import { Alert, Box, HStack, Label, Table, VStack } from "@navikt/ds-react";
import { useHentSak } from "~/api/useApi.ts";
import { DUMMY_BARN } from "~/routes/sak/reskontro/konstanter.ts";

const gjeld = (barn: SaksinformasjonBarn) => {
    return sumNullable(barn.restGjeldOffentlig, barn.restGjeldPrivat);
};
const tilUtbetaling = (barn: SaksinformasjonBarn) => {
    return sumNullable(barn.sumForskuddUtbetalt, barn.sumIkkeUtbetalt);
};

interface SakSummerProps {
    ident: string;
    bidragSak: Bidragssak;
}

export function SakSummer({ bidragSak }: SakSummerProps) {
    if (!bidragSak.saksnummer) {
        return <Alert variant={"warning"}>Saksnummer mangler for bidragssak</Alert>;
    }

    const { data: sak } = useHentSak(bidragSak.saksnummer);

    /**ELIN returnerer noen ganger et "ekstra" barn med fødselsnr 444444 44441. */

    const barn = bidragSak?.barn?.filter((barn) => barn.personident !== DUMMY_BARN) ?? [];
    const totalGjeld = barn.reduce((acc, barn) => acc + gjeld(barn), 0);
    const totalPrivatGjeld = barn.reduce((acc, barn) => sumNullable(acc, barn.restGjeldPrivat), 0);
    const totalOffGjeld = barn.reduce((acc, barn) => sumNullable(acc, barn.restGjeldOffentlig), 0);
    const totaltTilUtbetaling = barn.reduce((acc, barn) => acc + tilUtbetaling(barn), 0);
    const bmGjeld = sumNullable(bidragSak?.bmGjeldRest, bidragSak?.bmGjeldFastsettelsesgebyr);

    const NokkeltallForSak = () => (
        <VStack gap={"space-16"}>
            <HStack gap={"space-8"} justify={"space-between"}>
                <Label>Sak {bidragSak.saksnummer}</Label>
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
                                <Table.DataCell align={"right"}>{formaterBelop(gjeld(b))}</Table.DataCell>
                                <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldPrivat)}</Table.DataCell>
                                <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldOffentlig)}</Table.DataCell>
                                <Table.DataCell align={"right"}>{formaterBelop(tilUtbetaling(b))}</Table.DataCell>
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

    return (
        <Box
            borderColor="neutral-subtle"
            background={"neutral-soft"}
            padding="space-16"
            borderWidth="1"
            borderRadius="4"
        >
            <NokkeltallForSak />
        </Box>
    );
}
