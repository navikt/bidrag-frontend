import { PersonNavnIdent } from "@navikt/bidrag-ui-common";
import { Box, Label, Table, VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SaksinformasjonBarn } from "~/api/BidragReskontroApi";
import { hentInnkrevingForSaksnummer } from "~/api/query/reskontro.query";
import { formaterBelop } from "~/utils/belopUtils";

import { DUMMY_BARN } from "./konstanter";

interface SakNokkelTallProps {
    saksnummer: string;
}

const gjeld = (barn: SaksinformasjonBarn) => {
    return barn.restGjeldOffentlig + barn.restGjeldPrivat;
};
const tilUtbetaling = (barn: SaksinformasjonBarn) => {
    return barn.sumForskuddUtbetalt + barn.sumIkkeUtbetalt;
};

export function SakNokkelTall({ saksnummer }: SakNokkelTallProps) {
    const { data } = useSuspenseQuery(hentInnkrevingForSaksnummer(saksnummer));

    // TODO tester?
    /**ELIN returnerer noen ganger et "ekstra" barn med fødselsnr 444444 44441. */

    const barn = data?.barn?.filter((barn) => barn.personident !== DUMMY_BARN) ?? [];
    const totalGjeld = barn.reduce((acc, barn) => acc + gjeld(barn), 0);
    const totalPrivatGjeld = barn.reduce((acc, barn) => acc + barn.restGjeldPrivat, 0);
    const totalOffGjeld = barn.reduce((acc, barn) => acc + barn.restGjeldOffentlig, 0);
    const totaltTilUtbetaling = barn.reduce((acc, barn) => acc + tilUtbetaling(barn), 0);
    const bmGjeld = data?.bmGjeldRest + data?.bmGjeldFastsettelsesgebyr;

    return (
        <Box
            borderColor="neutral-subtle"
            background={"neutral-soft"}
            padding="space-16"
            borderWidth="1"
            borderRadius="4"
        >
            <VStack gap={"space-16"}>
                <Label>BPs gjeld i sak</Label>
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
                                    <Table.DataCell align={"right"}>
                                        {formaterBelop(b.restGjeldOffentlig)}
                                    </Table.DataCell>
                                    <Table.DataCell align={"right"}>{formaterBelop(tilUtbetaling(b))}</Table.DataCell>
                                    <Table.DataCell align={"center"}>
                                        {b.erStoppIUtbetaling ? "Ja" : "-"}
                                    </Table.DataCell>
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
                <Label>BMs gjeld i sak</Label>
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
        </Box>
    );
}
