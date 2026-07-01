import { useBisysParams } from "./useBisysParams";

export function useVedtakLink() {
    const { bisysQueryString } = useBisysParams();

    return {
        getVedtakLink: (vedtakId: string | number, saksnummer: string | number) => {
            const url = `/sak/${saksnummer}/vedtak/${vedtakId}`;
            if (bisysQueryString?.length > 0) {
                return `${url}?${bisysQueryString}`;
            }
            return url;
        },
    };
}
