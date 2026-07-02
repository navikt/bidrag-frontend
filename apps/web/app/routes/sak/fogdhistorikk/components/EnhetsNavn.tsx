import { Skeleton } from "@navikt/ds-react";
import { useHentEnhetInfomasjon } from "~/api/useApi.ts";

interface EnhetsNavn {
    enhetsnummer: string;
}

export function EnhetsNavn({ enhetsnummer }: EnhetsNavn) {
    const { data, isPending, error } = useHentEnhetInfomasjon(enhetsnummer);
    if (isPending) {
        return <Skeleton variant="text" width="60%" />;
    }
    if (error) {
        return null;
    }

    return <span>{data?.navn}</span>;
}
