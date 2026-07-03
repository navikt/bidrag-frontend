import { formaterBelop } from "@bidrag/utils/belopUtils";
import { Detail, HStack } from "@navikt/ds-react";
import { useMemo } from "react";
import type { TransaksjonAggregat } from "./TransaksjonAggregat";

interface Props {
    totalTransCount: number;
    aggregater: Array<TransaksjonAggregat>;
}

export function FiltrertTransaksjonSummer({
    aggregater,
    totalTransCount,
}: Props) {
    const transCount = useMemo(
        () => aggregater.reduce((sum, t) => sum + (t.antall ?? 0), 0),
        [aggregater],
    );
    const sumBelop = useMemo(
        () => aggregater.reduce((sum, t) => sum + (t.sumBeløp ?? 0), 0),
        [aggregater],
    );
    const sumRest = useMemo(
        () => aggregater.reduce((sum, t) => sum + (t.sumRestBeløp ?? 0), 0),
        [aggregater],
    );
    return (
        <HStack justify="end" gap="space-16" width={"100%"}>
            <Detail>
                Antall transaksjoner {transCount}/{totalTransCount}
            </Detail>
            <Detail>Sum beløp {formaterBelop(sumBelop)}</Detail>
            <Detail>Sum restbeløp {formaterBelop(sumRest)}</Detail>
        </HStack>
    );
}
