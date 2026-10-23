import { Resultatkode } from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, VStack } from "@navikt/ds-react";

import { BPsAndelInntekterTable } from "../../../common/components/vedtak/BPsAndelInntekterTable";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { sluttberegningResultat, useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BPsAndelUnderholdskostnad = () => {
    const { beregningsdetaljer, periode } = useBidragBeregningPeriode();
    const bpsAndel = beregningsdetaljer.bpsAndel;
    const inntekter = beregningsdetaljer.inntekter;
    const delberegningUnderholdskostnad = beregningsdetaljer.delberegningUnderholdskostnad;
    if (!delberegningUnderholdskostnad) return null;
    // Ved avslag for delt bosted beregnes ikke bidraget, så beløpet etter fratrekk regnes ut her
    const erAvslagDeltBosted = sluttberegningResultat(periode) === Resultatkode.BIDRAG_IKKE_BEREGNET_DELT_BOSTED;
    const bpAndelEtterFratrekkDeltBosted = erAvslagDeltBosted
        ? bpsAndel.andelBeløp - delberegningUnderholdskostnad.underholdskostnad * 0.5
        : beregningsdetaljer.sluttberegning.bpAndelAvUVedDeltBostedBeløp;
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
                    (beregningsdetaljer.deltBosted || erAvslagDeltBosted) && {
                        label: "Etter fratrekk delt bosted",
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(bpsAndel.andelBeløp, true)} - ${formatterBeløpForBeregning(delberegningUnderholdskostnad.underholdskostnad, true)} x ${formatterProsent(0.5)}`,
                        result: formatterBeløpForBeregning(bpAndelEtterFratrekkDeltBosted, true),
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
