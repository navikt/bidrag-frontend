import { BodyShort } from "@navikt/ds-react";

import { BPsAndelInntekterTable } from "../../../common/components/vedtak/BPsAndelInntekterTable";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { useGetBeregningSærbidrag } from "../../../common/hooks/useApiData";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";

export const BPsAndelUtgifter = () => {
    const { data: beregnetSærbidrag } = useGetBeregningSærbidrag();

    const bpsAndel = beregnetSærbidrag.resultat.bpsAndel;
    const inntekter = beregnetSærbidrag.resultat.inntekter;
    const utgifter = beregnetSærbidrag.resultat.delberegningUtgift;
    return (
        <>
            <BPsAndelInntekterTable inntekter={inntekter} forskuddssats={beregnetSærbidrag.resultat.forskuddssats} />
            <ResultatDescription
                data={[
                    {
                        label: "BP's andel prosent",
                        textRight: true,
                        value: `${formatterBeløpForBeregning(inntekter.inntektBP, true)} / ${formatterBeløpForBeregning(inntekter.totalEndeligInntekt, true)}`,
                        result: formatterProsent(bpsAndel.beregnetAndelFaktor),
                    },

                    {
                        label: "Andel utgifter",
                        textRight: true,
                        value: `${formatterBeløpForBeregning(utgifter.sumGodkjent, true)} X ${formatterProsent(bpsAndel.endeligAndelFaktor)}`,
                        result: formatterBeløpForBeregning(bpsAndel.andelBeløp, true),
                    },
                    bpsAndel.endeligAndelFaktor !== bpsAndel.beregnetAndelFaktor && {
                        textRight: false,
                        value: (
                            <BodyShort size="small" spacing className="text-ax-danger-600">
                                Andel begrenset til {formatterProsent(bpsAndel.endeligAndelFaktor)}
                            </BodyShort>
                        ),
                    },
                ]}
            />
        </>
    );
};
