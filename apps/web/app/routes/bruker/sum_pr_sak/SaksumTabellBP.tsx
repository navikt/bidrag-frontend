import type { Bidragssak, SaksinformasjonBarn } from "@bidrag/api/BidragReskontroApi";
import type { BidragssakDto } from "@bidrag/api/SakApi";
import { PersonIdent, PersonNavnIdent } from "@bidrag/common";
import { formaterBelop } from "@bidrag/utils";
import { Table } from "@navikt/ds-react";
import {
    beregnBarnGjeld,
    beregnTotalGjeld,
    beregnTotalOffentligGjeld,
    beregnTotalPrivatGjeld,
} from "~/common/reskontro/gjeldsberegninger.ts";
import { DUMMY_BARN } from "~/common/reskontro/konstanter.ts";
import { SumPerValutaCell } from "~/routes/bruker/sum_pr_sak/SumPerValutaCell.tsx";
import { useSaksumTabell } from "~/routes/bruker/sum_pr_sak/useSaksumTabell.ts";

const gjeld = (barn: SaksinformasjonBarn) => beregnBarnGjeld(barn);

interface SakSummerProps {
    ident: string;
    saksnummer: string;
    bidragSak: Bidragssak;
    sak?: BidragssakDto;
}

export function SaksumTabellBP({ bidragSak, saksnummer, ident, sak }: SakSummerProps) {
    const { sumBidragPerValuta, getBidragForBarn, reellMottakerIdent } = useSaksumTabell({
        saksnummer,
        ident,
        periodeFilter: "skyldner",
    });
    const roller = sak?.roller ?? [];
    const barn = bidragSak?.barn?.filter((barn) => barn.personident !== DUMMY_BARN) ?? [];

    const totalGjeld = beregnTotalGjeld(barn);
    const totalPrivatGjeld = beregnTotalPrivatGjeld(barn);
    const totalOffGjeld = beregnTotalOffentligGjeld(barn);

    return (
        <Table size="small">
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Barn</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Løpende bidrag</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Total gjeld</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Privat gjeld</Table.HeaderCell>
                    <Table.HeaderCell align={"right"}>Offentlig gjeld</Table.HeaderCell>
                    <Table.HeaderCell>Reell mottaker</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {barn.map((b) => (
                    <Table.Row key={b.personident}>
                        <Table.DataCell>
                            <PersonNavnIdent ident={b.personident} bareFornavn />
                        </Table.DataCell>
                        <Table.DataCell align={"right"}>{getBidragForBarn(b.personident)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(gjeld(b))}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldPrivat)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldOffentlig)}</Table.DataCell>
                        <Table.DataCell>
                            <PersonIdent ident={reellMottakerIdent(b.personident ?? undefined, roller)} />
                        </Table.DataCell>
                    </Table.Row>
                ))}
                <Table.Row>
                    <Table.DataCell />
                    <SumPerValutaCell sumPerValuta={sumBidragPerValuta} />
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalGjeld)}</strong>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalPrivatGjeld)}</strong>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalOffGjeld)}</strong>
                    </Table.DataCell>
                    <Table.DataCell />
                </Table.Row>
            </Table.Body>
        </Table>
    );
}
