import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningJusterBMsBarnetillegg = () => {
    const {
        beregningsdetaljer: { sluttberegning, delberegningUnderholdskostnad: underholdskostnad, barnetilleggBM },
    } = useBidragBeregningPeriode();
    const { erBisysVedtak } = useGetBehandlingV2();
    const barnetilleggSkattesats = barnetilleggBM.delberegningSkattesats;
    function renderResult() {
        if (sluttberegning.bidragJustertForNettoBarnetilleggBM) {
            return ` (justert til U - BMs netto barnetillegg + samværsfradrag)`;
        }
        return "";
    }

    return (
        <ResultatDescription
            data={[
                erBisysVedtak && {
                    label: "Manuelt beregnet skatteprosent",
                    textRight: false,
                    labelBold: true,
                    value: formatterProsent(barnetilleggSkattesats.skattFaktor),
                },
                {
                    label: "U - BMs netto barnetillegg",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(underholdskostnad.underholdskostnad)} - ${formatterBeløpForBeregning(barnetilleggBM.sumNettoBeløp)} = ${formatterBeløpForBeregning(sluttberegning.uminusNettoBarnetilleggBM)}`,
                },
                {
                    label: "Foreløpig bidrag",
                    textRight: false,
                    labelBold: true,
                    value: `${formatterBeløpForBeregning(sluttberegning.bruttoBidragEtterBarnetilleggBM)}${renderResult()}`,
                },
            ].filter((d) => d)}
        />
    );
};
