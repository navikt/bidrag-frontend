import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BEHANDLING_API_V1 } from "../../constants/api";
import { useBehandlingProvider } from "../../context/BehandlingContext";

type AinntektButtonProps = {
    ident: string;
};
export default function AinntektLink({ ident }: AinntektButtonProps) {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    const queryClient = useQueryClient();
    const queryKey = ["ainntekt_lenke", ident];
    const ainntektLenke = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const response = await BEHANDLING_API_V1.api.genererAinntektLenke({
                behandlingId: behandlingId ? Number(behandlingId) : undefined,
                vedtaksid: vedtakId ? Number(vedtakId) : undefined,
                ident,
            });
            return response.data;
        },
        enabled: true,
    });

    return (
        <Link
            href={ainntektLenke.data}
            target="_blank"
            className="font-ax-bold"
            onMouseOver={() => queryClient.prefetchQuery({ queryKey, staleTime: 20000 })}
        >
            A-inntekt <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
