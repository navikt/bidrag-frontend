import type { Bidragssak } from "@bidrag/api/BidragReskontroApi";
import type { BidragssakDto } from "@bidrag/api/SakApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop } from "@bidrag/utils";
import { Table } from "@navikt/ds-react";
import {
    beregnTotalForskuddUtbetalt,
    beregnTotalIkkeUtbetalt,
    beregnTotalPrivatRestGjeld,
} from "~/common/reskontro/gjeldsberegninger.ts";
import { SumPerValutaCell } from "~/routes/bruker/sum_pr_sak/SumPerValutaCell.tsx";
import { useAktivPeriode } from "~/routes/bruker/sum_pr_sak/useAktivPeriode.ts";

interface Props {
    ident: string;
    saksnummer: string;
    bidragSak: Bidragssak;
    sak?: BidragssakDto;
}

export function SaksumTabellRM({ bidragSak, saksnummer, ident, sak }: Props) {
    const { sumBidragPerValuta, sumForskuddPerValuta, getBidragForBarn, getForskuddForBarn } = useAktivPeriode({
        saksnummer,
        ident,
        periodeFilter: "mottaker",
    });
    const roller = sak?.roller ?? [];
    const barnMedReellMottaker =
        roller.filter((rolle) => rolle.reellMottaker?.ident === ident).map((rolle) => rolle.fodselsnummer) ?? [];

    const barn = bidragSak?.barn?.filter((barn) => barnMedReellMottaker.includes(barn.personident ?? "")) ?? [];

    const totalPrivatRestGjeld = beregnTotalPrivatRestGjeld(barn);
    const totalSumIkkeUtbetalt = beregnTotalIkkeUtbetalt(barn);
    const totalSumForskuddUtbetalt = beregnTotalForskuddUtbetalt(barn);

    return (
        <Table size="small">
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Barn</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Løpende bidrag</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Løpende forskudd</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>BMs andel av BPs gjeld</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Bidrag til utbetaling</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Forskudd til utbetaling</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {barn.map((b) => (
                    <Table.Row key={b.personident}>
                        <Table.DataCell>
                            <PersonNavnIdent ident={b.personident} bareFornavn />
                        </Table.DataCell>
                        <Table.DataCell align={"right"}>{getBidragForBarn(b.personident)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{getForskuddForBarn(b.personident)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldPrivatAndel)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.sumIkkeUtbetalt)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.sumForskuddUtbetalt)}</Table.DataCell>
                    </Table.Row>
                ))}
                <Table.Row>
                    <Table.DataCell />
                    <SumPerValutaCell sumPerValuta={sumBidragPerValuta} />
                    <SumPerValutaCell sumPerValuta={sumForskuddPerValuta} />
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalPrivatRestGjeld)}</strong>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalSumIkkeUtbetalt)}</strong>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalSumForskuddUtbetalt)}</strong>
                    </Table.DataCell>
                </Table.Row>
            </Table.Body>
        </Table>
    );
}
