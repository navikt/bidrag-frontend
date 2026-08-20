import { Heading, VStack } from "@navikt/ds-react";

import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const IndeksreguleringDetaljer = () => {
    const { beregningsdetaljer } = useBidragBeregningPeriode();
    const indeksreguleringDetaljer = beregningsdetaljer.indeksreguleringDetaljer;
    if (!indeksreguleringDetaljer) return null;
    return (
        <VStack gap="space-2">
            <Heading size="xsmall">Indeksregulering</Heading>
            <ResultatDescription
                data={[
                    {
                        label: "Indeksregulert beløp",
                        labelBold: true,
                        result: `${formatterBeløpForBeregning(indeksreguleringDetaljer.sluttberegning?.originaltBeløp?.verdi, true)}`,
                    },
                    {
                        label: "Indeksprosent",
                        labelBold: true,
                        result: `${formatterProsent(indeksreguleringDetaljer.faktor)}`,
                    },
                    {
                        label: "Beregning",
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(indeksreguleringDetaljer.sluttberegning?.originaltBeløp?.verdi, true)} x ${1 + indeksreguleringDetaljer.faktor / 100}`,
                        result: formatterBeløpForBeregning(indeksreguleringDetaljer.sluttberegning?.beløp?.verdi),
                    },
                ].filter((d) => d)}
            />
        </VStack>
    );
};
