import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { hentVisningsnavn } from "../../../common/hooks/useVisningsnavn";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export default function BeregningSamværsfradrag() {
    const { beregningsdetaljer } = useBidragBeregningPeriode();

    const beregning = beregningsdetaljer.samværsfradrag;
    if (!beregning) return null;
    const samværNetterBeskrivelse = () => {
        if (beregning.gjennomsnittligSamværPerMåned === 0) return "";
        return ` (samvær per måned: ${beregning.gjennomsnittligSamværPerMåned} ${beregning.gjennomsnittligSamværPerMåned === 1 ? "natt" : "netter"})`;
    };
    return (
        <ResultatDescription
            title="Samværsfradrag"
            data={[
                {
                    label: "Samværsklasse",
                    textRight: false,
                    labelBold: true,
                    value: `Samværsklasse ${hentVisningsnavn(beregning.samværsklasse)}${samværNetterBeskrivelse()}`,
                },
                {
                    label: "Samværsfradrag",
                    textRight: false,
                    labelBold: true,
                    value: formatterBeløpForBeregning(beregning.samværsfradrag),
                },
            ].filter((d) => d)}
        />
    );
}
