import { BodyShort, VStack } from "@navikt/ds-react";

import { BPsAndelInntekterTable } from "../../../common/components/vedtak/BPsAndelInntekterTable";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BPsAndelUnderholdskostnad = () => {
    const { beregningsdetaljer } = useBidragBeregningPeriode();
    const bpsAndel = beregningsdetaljer.bpsAndel;
    const inntekter = beregningsdetaljer.inntekter;
    const delberegningUnderholdskostnad = beregningsdetaljer.delberegningUnderholdskostnad;
    if (!delberegningUnderholdskostnad) return null;
    return (
        <VStack gap="space-2">
            <BPsAndelInntekterTable inntekter={inntekter} forskuddssats={beregningsdetaljer.forskuddssats} />
            <ResultatDescription
                data={[
                    {
                        label: "BP's andel av underholdskostnad (i prosent)",
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(inntekter.inntektBP, true)} / ${formatterBeløpForBeregning(inntekter.totalEndeligInntekt)}`,
                        result: formatterProsent(bpsAndel.beregnetAndelFaktor),
                    },
                    {
                        label: "Andel underholdskostnad",
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.underholdskostnad, true)} x ${formatterProsent(bpsAndel.endeligAndelFaktor)}`,
                        result: formatterBeløpForBeregning(bpsAndel.andelBeløp),
                    },
                    beregningsdetaljer.deltBosted && {
                        label: "Etter fratrekk delt bosted",
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(bpsAndel.andelBeløp, true)} - ${formatterBeløpForBeregning(delberegningUnderholdskostnad.underholdskostnad, true)} x ${formatterProsent(0.5)}`,
                        result: formatterBeløpForBeregning(
                            beregningsdetaljer.sluttberegning.bpAndelAvUVedDeltBostedBeløp,
                            true,
                        ),
                    },
                ].filter((d) => d)}
            />
            {bpsAndel.endeligAndelFaktor !== bpsAndel.beregnetAndelFaktor && (
                <BodyShort size="small" weight="semibold" spacing className="text-ax-danger-600 pl-[3px]">
                    Andel begrenset til {formatterProsent(bpsAndel.endeligAndelFaktor)}
                </BodyShort>
            )}
        </VStack>
    );
};
