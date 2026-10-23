import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningBarnetErSelvforsørget = () => {
    const { beregningsdetaljer } = useBidragBeregningPeriode();
    const forskuddssats = beregningsdetaljer.forskuddssats;
    return (
        <ResultatDescription
            title="Barnet er selvforsørget"
            data={[
                {
                    label: "BAs inntekt",
                    labelBold: true,
                    result: formatterBeløpForBeregning(beregningsdetaljer.inntekter?.inntektBarn, true),
                },
                {
                    label: "Grense for selvforsørget",
                    labelBold: true,
                    value: `100 x ${formatterBeløpForBeregning(forskuddssats)}`,
                    result: formatterBeløpForBeregning(forskuddssats * 100, true),
                },
            ]}
        />
    );
};
