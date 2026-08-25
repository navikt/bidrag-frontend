import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { Heading, Label, Table } from "@navikt/ds-react";
import { ROLE_FORKORTELSER } from "../../../common/constants/roleTags";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { barnetilleggTiltakspengerVisningsnavn } from "../../constants/beregning";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

type NettoBarnetilleggTableProps = {
    rolle: Rolletype;
};

export const NettoBarnetilleggTable = ({ rolle }: NettoBarnetilleggTableProps) => {
    const { beregningsdetaljer } = useBidragBeregningPeriode();

    const barnetillegg = rolle === Rolletype.BP ? beregningsdetaljer.barnetilleggBP : beregningsdetaljer.barnetilleggBM;
    const harBareTiltakspenger = barnetillegg.barnetillegg.every(
        (bt) => bt.visningsnavn === barnetilleggTiltakspengerVisningsnavn,
    );
    return (
        <>
            <Heading size="xsmall">Netto barnetillegg ({ROLE_FORKORTELSER[rolle]})</Heading>

            <Table size="small" zebraStripes className="table-fixed table bg-[white] w-full">
                <Table.Header>
                    <Table.Row className="align-baseline">
                        <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[200px]">
                            Type barnetillegg
                        </Table.HeaderCell>
                        {!harBareTiltakspenger && (
                            <Table.HeaderCell textSize="small" scope="col" align="left">
                                Brutto
                            </Table.HeaderCell>
                        )}
                        <Table.HeaderCell textSize="small" scope="col" align="left">
                            Skattesats
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" scope="col" align="left">
                            Netto
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {barnetillegg.barnetillegg.map((bt, index) => (
                        <Table.Row className="align-top" key={`${bt.visningsnavn}-${index}`}>
                            <Table.DataCell textSize="small">{bt.visningsnavn}</Table.DataCell>
                            {!harBareTiltakspenger && (
                                <Table.DataCell textSize="small">
                                    {bt.visningsnavn === barnetilleggTiltakspengerVisningsnavn
                                        ? "Ikke relevant"
                                        : formatterBeløpForBeregning(bt.bruttoBeløp)}
                                </Table.DataCell>
                            )}
                            <Table.DataCell textSize="small">{formatterProsent(bt.skattefaktor)}</Table.DataCell>
                            <Table.DataCell textSize="small">
                                {formatterBeløpForBeregning(bt.nettoBeløp)}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                    <Table.Row className="align-top">
                        <Table.DataCell textSize="small">
                            <Label size="small">Resultat</Label>
                        </Table.DataCell>
                        {!harBareTiltakspenger && (
                            <Table.DataCell textSize="small">
                                {formatterBeløpForBeregning(barnetillegg.sumBruttoBeløp)}
                            </Table.DataCell>
                        )}
                        <Table.DataCell textSize="small"></Table.DataCell>
                        <Table.DataCell textSize="small">
                            {formatterBeløpForBeregning(barnetillegg.sumNettoBeløp)}
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </>
    );
};
