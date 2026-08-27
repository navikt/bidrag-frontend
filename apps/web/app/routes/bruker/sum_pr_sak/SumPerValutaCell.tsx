import { formaterBelop } from "@bidrag/utils";
import { Table, VStack } from "@navikt/ds-react";

interface Props {
    sumPerValuta: [string, number][];
}

export function SumPerValutaCell({ sumPerValuta }: Props) {
    const getSum = () => {
        if (!sumPerValuta || sumPerValuta.length === 0) {
            return <strong>0</strong>;
        }
        return (
            <VStack gap={"space-4"} justify={"end"}>
                {sumPerValuta.map(([valuta, sum]) => (
                    <span key={valuta}>
                        <strong>{formaterBelop(sum)}</strong> {valuta}
                    </span>
                ))}
            </VStack>
        );
    };
    return <Table.DataCell align={"right"}>{getSum()}</Table.DataCell>;
}
