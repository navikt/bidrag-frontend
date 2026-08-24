import { Resultatkode } from "@bidrag/api/BidragBehandlingApiV1";
import { Table } from "@navikt/ds-react";
import { BPsEvne } from "../../../common/components/vedtak/BPsEvneTabell";
import { BpsBeregnedeTotalbidragTabellSærbidrag } from "../../../common/components/vedtak/BpsBeregnedeTotalbidragTabell";
import { useGetBehandlingV2, useGetBeregningSærbidrag } from "../../../common/hooks/useApiData";
import { formatterBeløp } from "../../../utils/number-utils";
import { BPsAndelUtgifter } from "./BPsAndelUtgifter";

export const DetaljertBeregningSærbidrag: React.FC = () => {
    const { data: beregnetSærbidrag } = useGetBeregningSærbidrag();

    return (
        <>
            <BPsAndelUtgifter />
            <BPsEvne
                inntekter={beregnetSærbidrag.resultat.inntekter}
                bidragsevne={beregnetSærbidrag.resultat.delberegningBidragsevne}
            />
            <BpsBeregnedeTotalbidragTabellSærbidrag />
            <BeregningResultatOppsummering />
        </>
    );
};

function BeregningResultatOppsummering() {
    const { data: beregnetSærbidrag } = useGetBeregningSærbidrag();
    const { medInnkreving } = useGetBehandlingV2();

    const resultat = beregnetSærbidrag.resultat;
    const erBeregningeAvslag = beregnetSærbidrag.resultat?.resultatKode !== Resultatkode.SAeRBIDRAGINNVILGET;

    return (
        <Table size="small" zebraStripes className="w-full">
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell colSpan={3} textSize="small" className="w-[250px]">
                        Beskrivelse
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.DataCell colSpan={2} textSize="small">
                        BP har evne
                    </Table.DataCell>
                    <Table.DataCell textSize="small" align="right">
                        {resultat.bpHarEvne === false
                            ? "Nei, bidragsevnen er lavere enn beregnet totalbidrag"
                            : "Ja, bidragsevnen er høyere enn beregnet totalbidrag"}
                    </Table.DataCell>
                </Table.Row>
                <Table.Row>
                    <Table.DataCell colSpan={2} textSize="small">
                        Resultat
                    </Table.DataCell>
                    <Table.DataCell textSize="small" align="right">
                        {erBeregningeAvslag ? "Avslag" : formatterBeløp(resultat.resultat, true)}
                    </Table.DataCell>
                </Table.Row>
                <Table.Row>
                    <Table.DataCell colSpan={2} textSize="small">
                        Betalt av BP
                    </Table.DataCell>
                    <Table.DataCell textSize="small" align="right">
                        {formatterBeløp(resultat.beregning?.totalBeløpBetaltAvBp, true)}
                    </Table.DataCell>
                </Table.Row>
                <Table.Row>
                    <Table.DataCell colSpan={2} textSize="small">
                        {medInnkreving ? "Beløp som innkreves" : "Fastsatt beløp å betale"}
                    </Table.DataCell>
                    <Table.DataCell textSize="small" align="right">
                        {erBeregningeAvslag ? "Avslag" : formatterBeløp(resultat.beløpSomInnkreves, true)}
                    </Table.DataCell>
                </Table.Row>
            </Table.Body>
        </Table>
    );
}
