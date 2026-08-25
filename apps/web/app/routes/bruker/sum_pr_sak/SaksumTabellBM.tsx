import type { Bidragssak } from "@bidrag/api/BidragReskontroApi";
import type { BidragssakDto } from "@bidrag/api/SakApi";
import { PersonIdent, PersonNavnIdent } from "@bidrag/common";
import { formaterBelop, sumNullable } from "@bidrag/utils";
import { Alert, Table, VStack } from "@navikt/ds-react";
import { useMemo } from "react";
import { DUMMY_BARN } from "~/common/reskontro/konstanter.ts";
import { useAktivPeriode } from "~/routes/bruker/sum_pr_sak/useAktivPeriode.ts";

interface Props {
    ident: string;
    bidragSak: Bidragssak;
    sak?: BidragssakDto;
}

export function SaksumTabellBM({ bidragSak, ident, sak }: Props) {
    if (!bidragSak.saksnummer) {
        return <Alert variant={"warning"}>Saksnummer mangler for bidragssak</Alert>;
    }
    const { aktivePerioder } = useAktivPeriode(bidragSak.saksnummer);
    /**ELIN returnerer noen ganger et "ekstra" barn med fødselsnr 444444 44441. */

    const roller = sak?.roller ?? [];

    const barn = bidragSak?.barn?.filter((barn) => barn.personident !== DUMMY_BARN) ?? [];
    const totalPrivatRestGjeld = barn.reduce((sum, b) => sum + (b.restGjeldPrivatAndel ?? 0), 0);
    const totalSumIkkeUtbetalt = barn.reduce((sum, b) => sum + (b.sumIkkeUtbetalt ?? 0), 0);
    const totalSumForskuddUtbetalt = barn.reduce((sum, b) => sum + (b.sumForskuddUtbetalt ?? 0), 0);

    const bidrag = aktivePerioder
        .filter((p) => p.mottaker === ident)
        .filter((p) => p.type === "BIDRAG" || p.type === "BIDRAG18AAR");

    const sumBidragPerValuta = useMemo(() => {
        const grupper = bidrag.reduce<Record<string, number>>((acc, rad) => {
            const valuta = rad.valutakode ?? "NOK";
            acc[valuta] = sumNullable(acc[valuta], rad.beløp);
            return acc;
        }, {});
        return Object.entries(grupper).sort(([a], [b]) => a.localeCompare(b));
    }, [bidrag]);

    const forskudd = aktivePerioder.filter((p) => p.mottaker === ident).filter((p) => p.type === "FORSKUDD");

    const sumForskuddPerValuta = useMemo(() => {
        const grupper = forskudd.reduce<Record<string, number>>((acc, rad) => {
            const valuta = rad.valutakode ?? "NOK";
            acc[valuta] = sumNullable(acc[valuta], rad.beløp);
            return acc;
        }, {});
        return Object.entries(grupper).sort(([a], [b]) => a.localeCompare(b));
    }, [forskudd]);

    const reellMottaker = (barnIdent?: string) => {
        return roller.find((rolle) => rolle.fodselsnummer === barnIdent)?.reellMottaker?.ident ?? "-";
    };

    const getBidragForBarn = (ident?: string | null) => {
        const b = bidrag.find((p) => p.kravhaver === ident);
        return `${formaterBelop(b?.beløp)}  ${b?.valutakode ?? ""} `;
    };

    const getForskuddForBarn = (ident?: string | null) => {
        const b = forskudd.find((p) => p.kravhaver === ident);
        return `${formaterBelop(b?.beløp)}  ${b?.valutakode ?? ""} `;
    };
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
                        <Table.DataCell align={"right"}>{getForskuddForBarn(b.personident)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.restGjeldPrivatAndel)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.sumIkkeUtbetalt)}</Table.DataCell>
                        <Table.DataCell align={"right"}>{formaterBelop(b.sumForskuddUtbetalt)}</Table.DataCell>
                        <Table.DataCell>
                            <PersonIdent ident={reellMottaker(b.personident ?? undefined)} />
                        </Table.DataCell>
                    </Table.Row>
                ))}
                <Table.Row>
                    <Table.DataCell />
                    <Table.DataCell align={"right"}>
                        <VStack gap={"space-4"} justify={"end"}>
                            {sumBidragPerValuta.map(([valuta, sum]) => (
                                <span key={valuta}>
                                    <strong>{formaterBelop(sum)}</strong> {valuta}
                                </span>
                            ))}
                        </VStack>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <VStack gap={"space-4"} justify={"end"}>
                            {sumForskuddPerValuta.map(([valuta, sum]) => (
                                <span key={valuta}>
                                    <strong>{formaterBelop(sum)}</strong> {valuta}
                                </span>
                            ))}
                        </VStack>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalPrivatRestGjeld)}</strong>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalSumIkkeUtbetalt)}</strong>
                    </Table.DataCell>
                    <Table.DataCell align={"right"}>
                        <strong>{formaterBelop(totalSumForskuddUtbetalt)}</strong>
                    </Table.DataCell>
                    <Table.DataCell />
                </Table.Row>
            </Table.Body>
        </Table>
    );
}
