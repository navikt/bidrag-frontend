import type { TilgangsFeilError } from "@bidrag/api";
import { Alert } from "@navikt/ds-react";
import type { AxiosError } from "axios";
import LasterSkeleton from "./LasterSkeleton";

type Props = {
    enhet: string | null;
    enhetNavn: string | null;
    isLoading: boolean;
    error: AxiosError<string> | TilgangsFeilError | null;
};

export default function EnhetInfoAlert({ enhet, enhetNavn, isLoading, error }: Props) {
    if (isLoading) {
        return <LasterSkeleton tekst="Henter enhet for person..." />;
    }

    if (error) {
        return (
            <Alert variant="error" size="small">
                {error.message}
            </Alert>
        );
    }

    if (enhet) {
        return (
            <Alert variant="info" size="small">
                Saken vil bli sendt til enhet {enhetNavn} ({enhet})
            </Alert>
        );
    }

    return null;
}
