import { Loader } from "@navikt/ds-react";
import { hentVisningsnavnFraType } from "@shared/kodeverk";
import { useQuery } from "@tanstack/react-query";
import {hentVedtakQuery} from "~/api/query/vedtak.query.ts";


interface VedtaksTypeProps {
    vedtaksId: number;
}
export function VedtaksType({ vedtaksId }: VedtaksTypeProps) {
    const { data, error, isPending } = useQuery(hentVedtakQuery(vedtaksId));
    if (isPending) {
        return <Loader size="xsmall" />;
    }
    if (error) {
        return vedtaksId;
    }
    const vedtaksType = data.type;
    return hentVisningsnavnFraType("vedtakstype", vedtaksType);
}
