import type { DelberegningBidragsevneDto, ResultatBeregningInntekterDto } from "@bidrag/api/BidragBehandlingApiV1";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { CalculationTabell, MathDivision, MathMultiplication, MathValue } from "./CalculationTable";

type BPsEvneProps = {
    bidragsevne: DelberegningBidragsevneDto;
    inntekter: ResultatBeregningInntekterDto;
};

export const BPsEvne = ({ bidragsevne, inntekter }: BPsEvneProps) => {
    if (!bidragsevne) return null;
    return (
        <CalculationTabell
            title="BP's evne"
            data={[
                {
                    label: "Inntekt",
                    value: (
                        <MathDivision top={`${formatterBeløpForBeregning(inntekter.inntektBP, true)}/år`} bottom={12} />
                    ),
                    result: <MathValue value={formatterBeløpForBeregning(inntekter.inntektBPMånedlig, true)} />,
                },
                {
                    label: "Skatt",
                    value: (
                        <MathDivision
                            negativeValue
                            top={`${formatterBeløpForBeregning(bidragsevne.skatt.skattAlminneligInntekt, true)}/år`}
                            bottom={12}
                        />
                    ),
                    result: (
                        <MathValue
                            negativeValue
                            value={formatterBeløpForBeregning(
                                bidragsevne.skatt.skattAlminneligInntektMånedsbeløp,
                                true,
                            )}
                        />
                    ),
                },
                {
                    label: "Trygdeavgift",
                    value: (
                        <MathDivision
                            negativeValue
                            top={`${formatterBeløpForBeregning(bidragsevne.skatt.trygdeavgift, true)}/år`}
                            bottom={12}
                        />
                    ),
                    result: (
                        <MathValue
                            negativeValue
                            value={formatterBeløpForBeregning(bidragsevne.skatt.trygdeavgiftMånedsbeløp, true)}
                        />
                    ),
                },
                {
                    label: "Trinnskatt",
                    value: (
                        <MathDivision
                            negativeValue
                            top={`${formatterBeløpForBeregning(bidragsevne.skatt.trinnskatt, true)}/år`}
                            bottom={12}
                        />
                    ),
                    result: (
                        <MathValue
                            negativeValue
                            value={formatterBeløpForBeregning(bidragsevne.skatt.trinnskattMånedsbeløp, true)}
                        />
                    ),
                },
                {
                    label: "Underhold egne barn i husstand",
                    value: (
                        <MathMultiplication
                            negativeValue
                            left={`${formatterBeløpForBeregning(bidragsevne.underholdEgneBarnIHusstand.sjablon, true)}`}
                            right={bidragsevne.underholdEgneBarnIHusstand.antallBarnIHusstanden}
                        />
                    ),
                    result: (
                        <MathValue
                            negativeValue
                            value={formatterBeløpForBeregning(bidragsevne.underholdEgneBarnIHusstand.måndesbeløp, true)}
                        />
                    ),
                },
                {
                    label: "Boutgift",
                    value: bidragsevne.utgifter.borMedAndreVoksne
                        ? "Bor med andre voksne"
                        : "Bor ikke med andre voksne",
                    result: (
                        <MathValue
                            negativeValue
                            value={formatterBeløpForBeregning(bidragsevne.utgifter.boutgiftBeløp, true)}
                        />
                    ),
                },
                {
                    label: "Eget underhold",
                    value: bidragsevne.utgifter.borMedAndreVoksne
                        ? "Bor med andre voksne"
                        : "Bor ikke med andre voksne",
                    result: (
                        <MathValue
                            negativeValue
                            value={formatterBeløpForBeregning(bidragsevne.utgifter.underholdBeløp, true)}
                        />
                    ),
                },
            ]}
            result={{
                label: "Bidragsevne",
                value: formatterBeløpForBeregning(bidragsevne.bidragsevne, true),
            }}
        />
    );
};
