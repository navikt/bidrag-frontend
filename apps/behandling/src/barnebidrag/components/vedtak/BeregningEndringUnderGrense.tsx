import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningEndringUnderGrense = () => {
    const {
        beregningsdetaljer: { endringUnderGrense },
    } = useBidragBeregningPeriode();

    // if (!erEndringUnderGrense) return null;

    if (!endringUnderGrense) return null;
    return (
        <ResultatDescription
            title={endringUnderGrense.endringErOverGrense ? "Endring fra løpende bidrag" : "Endring under grense"}
            data={[
                {
                    label: "Løpende bidragsbeløp",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(endringUnderGrense.løpendeBidragBeløp)}`,
                },
                {
                    label: "Endring i prosent",
                    textRight: false,
                    labelBold: true,
                    value: `(${formatterBeløpForBeregning(endringUnderGrense.løpendeBidragBeløp)} - ${formatterBeløpForBeregning(endringUnderGrense.beregnetBidragBeløp)}) / ${formatterBeløpForBeregning(endringUnderGrense.løpendeBidragBeløp)} = ${formatterProsent(endringUnderGrense.faktiskEndringFaktor, true)}`,
                },
            ].filter((d) => d)}
        />
    );
};
