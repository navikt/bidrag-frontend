import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningJusterBPsBarnetillegg = () => {
    const {
        beregningsdetaljer: { sluttberegning, barnetilleggBP },
    } = useBidragBeregningPeriode();
    const { erBisysVedtak } = useGetBehandlingV2();
    const barnetilleggSkattesats = barnetilleggBP.delberegningSkattesats;
    function renderResult() {
        if (sluttberegning?.bidragJustertForNettoBarnetilleggBP) {
            return ` (justert opp til BPs netto barnetillegg)`;
        }
        return "";
    }

    function hentForeløpigBidrag() {
        if (sluttberegning?.bidragJustertForNettoBarnetilleggBP) {
            return formatterBeløpForBeregning(sluttberegning?.bruttoBidragEtterBarnetilleggBP);
        } else if (sluttberegning?.begrensetRevurderingUtført) {
            return formatterBeløpForBeregning(sluttberegning?.bruttoBidragEtterBegrensetRevurdering);
        }
        return formatterBeløpForBeregning(sluttberegning?.bruttoBidragJustertForEvneOg25Prosent);
    }
    return (
        <div>
            <ResultatDescription
                data={[
                    erBisysVedtak && {
                        label: "Manuelt beregnet skatteprosent",
                        textRight: false,
                        labelBold: true,
                        value: formatterProsent(barnetilleggSkattesats.skattFaktor),
                    },
                    {
                        label: "Foreløpig bidrag",
                        textRight: false,
                        labelBold: true,
                        value: `${hentForeløpigBidrag()}${renderResult()}`,
                    },
                ].filter((d) => d)}
            />
        </div>
    );
};
