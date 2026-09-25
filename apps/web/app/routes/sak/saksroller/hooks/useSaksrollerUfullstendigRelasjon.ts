import { useEffect, useState } from "react";

export function useSaksrollerUfullstendigRelasjon({
    barnIdenter,
    barnIdenterKey,
    bidragspliktigIdent,
    bidragsmottakerIdent,
    finnBarnMedUfullstendigRelasjon,
    harSak,
}: {
    barnIdenter: string[];
    barnIdenterKey: string;
    bidragspliktigIdent?: string;
    bidragsmottakerIdent?: string;
    finnBarnMedUfullstendigRelasjon: (
        barnIdenter: string[],
        bidragsmottakerIdent?: string,
        bidragspliktigIdent?: string,
    ) => Promise<string[]>;
    harSak: boolean;
}) {
    const [barnMedUfullstendigRelasjon, setBarnMedUfullstendigRelasjon] = useState<string[]>([]);

    useEffect(() => {
        if (!harSak || barnIdenter.length === 0) {
            setBarnMedUfullstendigRelasjon([]);
            return;
        }

        finnBarnMedUfullstendigRelasjon(barnIdenter, bidragsmottakerIdent, bidragspliktigIdent).then(
            setBarnMedUfullstendigRelasjon,
        );
    }, [barnIdenterKey, bidragspliktigIdent, bidragsmottakerIdent, finnBarnMedUfullstendigRelasjon, harSak]);

    return barnMedUfullstendigRelasjon;
}
