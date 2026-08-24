import { BodyShort } from "@navikt/ds-react";
import { DateToDDMMYYYYString, dateOrNull } from "../../utils/date-utils";
import { useHentVedtak } from "../hooks/useApiData";

/**
 * Displays the vedtakstidspunkt (decision timestamp) for a given vedtak.
 * Fetches data in the background and shows nothing if an error occurs or data is unavailable.
 *
 * @param vedtakId - The ID of the vedtak to fetch
 * @returns A component displaying vedtakstidspunkt or null if unavailable
 */
export function VedtakstidspunktDisplay({ vedtakId }: { vedtakId?: number }) {
    const { data } = useHentVedtak(vedtakId);

    if (!data?.vedtakstidspunkt) {
        return null;
    }

    return <BodyShort>({DateToDDMMYYYYString(dateOrNull(data.vedtakstidspunkt))})</BodyShort>;
}
