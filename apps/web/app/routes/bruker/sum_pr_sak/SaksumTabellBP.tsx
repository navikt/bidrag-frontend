import type { Bidragssak, SaksinformasjonBarn } from "@bidrag/api/BidragReskontroApi";
import type { BidragssakDto } from "@bidrag/api/SakApi";
import { PersonIdent, PersonNavnIdent } from "@bidrag/common";
import { formaterBelop, sumNullable } from "@bidrag/utils";
import { Alert, Table } from "@navikt/ds-react";
import {
    beregnTotalGjeld,
    beregnTotalOffentligGjeld,
    beregnTotalPrivatGjeld,
    beregnTotaltTilUtbetaling,
} from "~/common/reskontro/gjeldsberegninger.ts";
import { DUMMY_BARN } from "~/common/reskontro/konstanter.ts";

const gjeld = (barn: SaksinformasjonBarn) => {
    return sumNullable(barn.restGjeldOffentlig, barn.restGjeldPrivat);
};
const tilUtbetaling = (barn: SaksinformasjonBarn) => {
    return sumNullable(barn.sumForskuddUtbetalt, barn.sumIkkeUtbetalt);
};

interface SakSummerProps {
    ident: string;
    bidragSak: Bidragssak;
    sak?: BidragssakDto;
}

export function SaksumTabellBP({ bidragSak, ident, sak }: SakSummerProps) {
    if (!bidragSak.saksnummer) {
        return <Alert variant={"warning"}>Saksnummer mangler for bidragssak</Alert>;
    }

    /**ELIN returnerer noen ganger et "ekstra" barn med fødselsnr 444444 44441. */

    const roller = sak?.roller ?? [];

    const barn = bidragSak?.barn?.filter((barn) => barn.personident !== DUMMY_BARN) ?? [];
    const totalGjeld = beregnTotalGjeld(barn);
    const totalPrivatGjeld = beregnTotalPrivatGjeld(barn);
    const totalOffGjeld = beregnTotalOffentligGjeld(barn);
    const totaltTilUtbetaling = beregnTotaltTilUtbetaling(barn);

    const reellMottaker = (barnIdent?: string) => {
        return roller.find((rolle) => rolle.fodselsnummer === barnIdent)?.reellMottaker?.ident ?? "-";
    };

    return (
        <Table size="small">
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Barn</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Total gjeld</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Privat gjeld</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Offentlig gjeld</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Løpende bidrag</Table.HeaderCell>
                    <Table.HeaderCell>Reell mottaker</Table.HeaderCell>
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
                        <Table.DataCell>
                            <PersonIdent ident={reellMottaker(b.personident ?? undefined)} />
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
    );
}
