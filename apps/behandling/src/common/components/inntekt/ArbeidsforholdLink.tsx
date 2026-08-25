import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BEHANDLING_API_V1 } from "../../constants/api";

type AinntektButtonProps = {
    ident: string;
};
export default function ArbeidsforholdLink({ ident }: AinntektButtonProps) {
    const queryClient = useQueryClient();
    const queryKey = ["aareg_lenke", ident];
    const ainntektLenke = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const response = await BEHANDLING_API_V1.api.genererAaregLenke(JSON.stringify(ident));
            return response.data;
        },
        enabled: false,
    });

    return (
        <Link
            href={ainntektLenke.data}
            target="_blank"
            className="font-ax-bold"
            onMouseOver={() => queryClient.prefetchQuery({ queryKey, staleTime: 20000 })}
        >
            AA-register <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
