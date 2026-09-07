import type { PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

import EnhetInfoAlert from "./components/EnhetInfoAlert";
import SubmitButtons from "./components/SubmitButtons";
import { useBestemEnhet } from "./hooks/useBestemEnhet";
import { useOpprettSakHandling } from "./hooks/useOpprettSakHandling";
import type { OpprettSakFormData } from "./OpprettSakFormProvider";

type Props = PropsWithChildren<{
    disabled?: boolean;
    additionalDisableConditions?: boolean;
}>;

/**
 * Wrapper component that provides unified submit buttons for all flows
 * Handles enhet determination and form submission
 */
export default function OpprettSakFormWrapper({
    children,
    disabled = false,
    additionalDisableConditions = false,
}: Props) {
    const form = useFormContext<OpprettSakFormData>();

    const formValues = form.watch();
    const partISaken = "partISaken" in formValues ? formValues.partISaken : null;
    const valgteBarn = "valgteBarn" in formValues ? formValues.valgteBarn : [];
    const motpart = "motpart" in formValues ? formValues.motpart : null;
    const arbeidsfordeling = "arbeidsfordeling" in formValues ? formValues.arbeidsfordeling : undefined;

    const bidragspliktig = partISaken?.rolle === "bidragspliktig" ? partISaken : motpart;
    const bidragsmottaker = partISaken?.rolle === "bidragsmottaker" ? partISaken : motpart;

    const {
        enhet,
        enhetNavn,
        isLoading: isLoadingEnhet,
        error: enhetError,
    } = useBestemEnhet({
        bidragspliktig,
        bidragsmottaker,
        barn: valgteBarn || [],
    });

    const {
        opprettSakFraSkjema,
        isLoading: isLoadingOpprettSak,
        error,
        saksnummer,
    } = useOpprettSakHandling({
        enhet: enhet ?? "",
        arbeidsfordeling: arbeidsfordeling ?? "EEN",
    });

    const handleSubmit = form.handleSubmit(async (data) => {
        await opprettSakFraSkjema(data as Parameters<typeof opprettSakFraSkjema>[0]);
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            {children}

            <EnhetInfoAlert enhet={enhet} enhetNavn={enhetNavn} isLoading={isLoadingEnhet} error={enhetError} />

            <SubmitButtons
                disabled={disabled || additionalDisableConditions || isLoadingEnhet}
                isLoading={isLoadingOpprettSak}
                error={error}
                saksnummer={saksnummer}
            />
        </form>
    );
}
