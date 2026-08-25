import { BodyShort, Heading, HStack, VStack } from "@navikt/ds-react";

import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { hentVisningsnavn } from "../../../common/hooks/useVisningsnavn";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const AldersjusteringUnderholdskostnader = () => {
    const { beregningsdetaljer, periode } = useBidragBeregningPeriode();
    const bpsAndel = beregningsdetaljer.bpsAndel;
    const delberegningUnderholdskostnad = beregningsdetaljer.delberegningUnderholdskostnad;
    if (!delberegningUnderholdskostnad) return null;
    return (
        <HStack gap="space-2">
            <VStack gap="space-2">
                <Heading size="xsmall">Underholdskostnad</Heading>
                <ResultatDescription
                    data={[
                        {
                            label: "Forbruksutgift",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.forbruksutgift, true)}`,
                        },
                        {
                            label: "Boutgift",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.boutgift, true)}`,
                        },
                        {
                            label: "Netto tilsynsutgift",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.nettoTilsynsutgift, true)}`,
                        },
                        {
                            label: "Barnetrygd",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.barnetrygd, true)}`,
                        },
                        {
                            label: "Barnetilsyn med stønad",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.barnetilsynMedStønad, true)}`,
                        },
                    ].filter((d) => d)}
                />
                <ResultatDescription
                    data={[
                        {
                            label: "Underholdskostnad",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.underholdskostnad, true)}`,
                        },
                        {
                            label: "Andel underholdskostnad",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(delberegningUnderholdskostnad.underholdskostnad, true)} x ${formatterProsent(periode.bpsAndelU)}`,
                            result: formatterBeløpForBeregning(periode.bpsAndelBeløp),
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
            <VStack gap="space-2">
                <Heading size="xsmall">Samvær</Heading>
                <ResultatDescription
                    data={[
                        {
                            label: "Samværsklasse",
                            labelBold: true,
                            value: `${hentVisningsnavn(beregningsdetaljer.samværsfradrag?.samværsklasse)}`,
                        },
                        {
                            label: "Samværsfradrag",
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(beregningsdetaljer.samværsfradrag?.samværsfradrag, true)}`,
                        },
                    ].filter((d) => d)}
                />
            </VStack>
        </HStack>
    );
};
