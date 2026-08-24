import type {
    DelberegningBidragspliktigesAndel,
    ResultatBeregningInntekterDto,
} from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort } from "@navikt/ds-react";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { CalculationTabell } from "./CalculationTable";

type BPsAndelProps = {
    inntekter: ResultatBeregningInntekterDto;
    bpsAndel: DelberegningBidragspliktigesAndel;
    forskuddssats: number;
};

export const BPsAndelInntekterTable = ({
    inntekter,
    forskuddssats,
}: Omit<BPsAndelProps, "bpsAndel" | "delberegningUnderholdskostnad">) => {
    return (
        <CalculationTabell
            title="BP's andel"
            data={[
                {
                    label: "BPs inntekt",
                    result: formatterBeløpForBeregning(inntekter.inntektBP, true),
                },
                {
                    label: "BMs inntekt",
                    result: formatterBeløpForBeregning(inntekter.inntektBM, true),
                },
                {
                    label: "BAs inntekt",
                    value: (
                        <>
                            {inntekter.inntektBarn > 0 && (
                                <BodyShort size="small">
                                    {formatterBeløpForBeregning(inntekter.inntektBarn)} - 30 x{" "}
                                    {formatterBeløpForBeregning(forskuddssats)}
                                </BodyShort>
                            )}
                        </>
                    ),
                    result: formatterBeløpForBeregning(inntekter.barnEndeligInntekt, true),
                },
            ]}
            result={{
                label: "Total inntekt",
                value: formatterBeløpForBeregning(inntekter.totalEndeligInntekt, true),
            }}
        />
    );
};
