import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const EndeligBidragTable = () => {
    const {
        beregningsdetaljer: { deltBosted, sluttberegning, sluttberegningAldersjustering, samværsfradrag: beregning },
    } = useBidragBeregningPeriode();

    return (
        <ResultatDescription
            title="Endelig bidrag"
            data={[
                !deltBosted && {
                    label: "Etter samværsfradraget",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(sluttberegningAldersjustering?.bpAndelBeløp ?? sluttberegning?.bruttoBidragEtterBarnetilleggBP)} - ${formatterBeløpForBeregning(beregning?.samværsfradrag)} = ${formatterBeløpForBeregning(sluttberegningAldersjustering?.beregnetBeløp ?? sluttberegning?.beregnetBeløp)}`,
                },
                {
                    label: "Avrundet beløp",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(sluttberegningAldersjustering?.resultatBeløp ?? sluttberegning?.resultatBeløp)}`,
                },
            ].filter((d) => d)}
        />
    );
};
