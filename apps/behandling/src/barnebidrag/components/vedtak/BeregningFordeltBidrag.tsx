import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningFordeltBidrag = () => {
    const {
        beregningsdetaljer: {
            sluttberegning,
            sluttberegningAldersjustering,
            delberegningBidragsevne: evne,
            forholdsmessigFordeling,
        },
    } = useBidragBeregningPeriode();

    if (!evne) return null;
    const erFF =
        (sluttberegning.bpAndelAvUVedForholdsmessigFordelingFaktor &&
            sluttberegning.bpAndelAvUVedForholdsmessigFordelingFaktor < 1) ||
        forholdsmessigFordeling?.erForholdsmessigFordelt;
    function renderResult() {
        if (erFF) return "";
        if (sluttberegning.bidragJustertNedTilEvne) {
            return ` (redusert ned til evne)`;
        } else if (sluttberegning.bidragJustertNedTil25ProsentAvInntekt) {
            return ` (redusert ned til 25% av inntekt)`;
        }
        return "";
    }

    const foreløpigBidrag =
        sluttberegningAldersjustering?.beregnetBeløp ?? sluttberegning.bruttoBidragJustertForEvneOg25Prosent;
    return (
        <ResultatDescription
            data={[
                {
                    label: "25% av inntekt",
                    textRight: false,
                    labelBold: true,
                    value: formatterBeløpForBeregning(evne.sumInntekt25Prosent),
                },
                !erFF && {
                    label: "Foreløpig bidrag",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(foreløpigBidrag)}${renderResult()}`,
                },
            ].filter((d) => d)}
        />
    );
};
