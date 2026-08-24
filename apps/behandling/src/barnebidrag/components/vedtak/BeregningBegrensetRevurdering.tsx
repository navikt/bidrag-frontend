import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningBegrensetRevurdering = () => {
    const {
        beregningsdetaljer: { sluttberegning, samværsfradrag },
    } = useBidragBeregningPeriode();

    if (!sluttberegning.bidragJustertTilForskuddssats) return null;
    return (
        <ResultatDescription
            title="Begrenset revurdering"
            data={[
                {
                    label: "Løpende forskudd",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(sluttberegning.løpendeForskudd ?? 0)}`,
                },
                {
                    label: "Løpende bidrag",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(sluttberegning.løpendeBidrag ?? 0)}`,
                },
                {
                    label: "Foreløpig bidrag",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(sluttberegning.løpendeForskudd ?? 0)} + ${formatterBeløpForBeregning(samværsfradrag.samværsfradrag)}`,
                    result: `${formatterBeløpForBeregning(sluttberegning.bruttoBidragEtterBegrensetRevurdering)}`,
                },
            ].filter((d) => d)}
        />
    );
};
