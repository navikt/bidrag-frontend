import type { FatteVedtakRevurderingsbarn } from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyShort, Box, Heading, Switch, Textarea } from "@navikt/ds-react";
import { useCallback, useEffect, useState } from "react";
import { useGetBehandlingV2, useGetBeregningBidrag } from "../../hooks/useApiData";

interface OverstyrFatteVedtakRevurderingSwitchProps {
    /** Default value for whether revurdering should be overridden */
    /** Callback when the override state changes */
    onChange: (fatteVedtakBegrunnelse?: FatteVedtakRevurderingsbarn) => void;
    onValidationChange?: (isInvalid: boolean) => void;
    onBeregningToggle?: (skalFatteVedtakForRevurderingsbarn: boolean) => void;
}

/**
 * Component for toggling manual override of revurdering with optional justification.
 * Shows a text field for justification when the switch is set to opposite of default.
 */
export const OverstyrFatteVedtakRevurderingSwitch = ({
    onChange,
    onValidationChange,
    onBeregningToggle,
    kanFatteVedtakForRevurderingsbarn: kanFatteVedtakForRevurderingsbarnInput,
    skalFatteVedtakForRevurderingsbarn: skalFatteVedtakForRevurderingsbarnInput,
    manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse,
}: OverstyrFatteVedtakRevurderingSwitchProps & {
    kanFatteVedtakForRevurderingsbarn?: boolean;
    skalFatteVedtakForRevurderingsbarn?: boolean;
    manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse?: string;
}) => {
    const kanFatteVedtakForRevurderingsbarn =
        kanFatteVedtakForRevurderingsbarnInput ??
        useGetBeregningBidrag(true).data?.resultat?.kanFatteVedtakForRevurderingsbarn;
    const { lesemodus: lesemodusBehandling } = useGetBehandlingV2();
    const erLesemodus = !!lesemodusBehandling;
    const skalFatteVedtakForRevurderingsbarn =
        skalFatteVedtakForRevurderingsbarnInput ??
        useGetBeregningBidrag(true).data?.resultat?.skalFatteVedtakForRevurderingsbarn;
    const [overstyrtFatteVedtak, setOverstyrtFatteVedtak] = useState(false);
    const [begrunnelse, setBegrunnelse] = useState<string>("");
    const [showValidationError, setShowValidationError] = useState(false);

    useEffect(() => {
        const initOverstyring = !!manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse;
        setOverstyrtFatteVedtak(initOverstyring);
        setBegrunnelse(manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse || "");
    }, [manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse]);

    useEffect(() => {
        const trimmetBegrunnelse = begrunnelse.trim();

        // Initaliser fatte vedtak status slik at det alltid sendes hva som ble vist til saksbehandler ved innsendelse, selv om de ikke har endret på bryteren
        onChange({
            foreslåttFatteVedtak: skalFatteVedtakForRevurderingsbarn,
            manueltOverstyrtForslagBegrunnelse:
                overstyrtFatteVedtak && trimmetBegrunnelse.length > 0 ? trimmetBegrunnelse : undefined,
            bleFFTrukket: !!kanFatteVedtakForRevurderingsbarn,
        });
    }, [skalFatteVedtakForRevurderingsbarn, kanFatteVedtakForRevurderingsbarn, overstyrtFatteVedtak, begrunnelse]);

    useEffect(() => {
        onValidationChange?.(!erLesemodus && overstyrtFatteVedtak && begrunnelse.trim().length === 0);
    }, [erLesemodus, overstyrtFatteVedtak, begrunnelse, onValidationChange]);

    const handleToggle = useCallback(
        (value: React.ChangeEvent<HTMLInputElement>) => {
            const nyOverstyring = value.target.checked;
            const skalFatteVedtakEtterOverstyring = nyOverstyring
                ? !skalFatteVedtakForRevurderingsbarn
                : skalFatteVedtakForRevurderingsbarn;
            const trimmedBegrunnelse = begrunnelse.trim();
            const isInvalid = nyOverstyring && trimmedBegrunnelse.length === 0;
            setOverstyrtFatteVedtak(nyOverstyring);
            setShowValidationError(isInvalid);
            onValidationChange?.(isInvalid);
            onBeregningToggle?.(skalFatteVedtakEtterOverstyring);

            onChange(
                nyOverstyring && trimmedBegrunnelse.length > 0
                    ? {
                          foreslåttFatteVedtak: skalFatteVedtakEtterOverstyring,
                          manueltOverstyrtForslagBegrunnelse: trimmedBegrunnelse,
                          bleFFTrukket: !!kanFatteVedtakForRevurderingsbarn,
                      }
                    : undefined,
            );
        },
        [
            begrunnelse,
            kanFatteVedtakForRevurderingsbarn,
            onBeregningToggle,
            onChange,
            onValidationChange,
            skalFatteVedtakForRevurderingsbarn,
        ],
    );

    const handleBegrunnelseChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newBegrunnelse = e.target.value;
            const trimmedBegrunnelse = newBegrunnelse.trim();
            const isInvalid = overstyrtFatteVedtak && trimmedBegrunnelse.length === 0;
            setBegrunnelse(newBegrunnelse);
            setShowValidationError(isInvalid);
            onValidationChange?.(isInvalid);

            onChange(
                overstyrtFatteVedtak && trimmedBegrunnelse.length > 0
                    ? {
                          foreslåttFatteVedtak: skalFatteVedtakForRevurderingsbarn,
                          manueltOverstyrtForslagBegrunnelse: trimmedBegrunnelse,
                          bleFFTrukket: !!kanFatteVedtakForRevurderingsbarn,
                      }
                    : undefined,
            );
        },
        [overstyrtFatteVedtak, onChange, onValidationChange],
    );

    function renderInfoText() {
        if (lesemodusBehandling) {
            if (skalFatteVedtakForRevurderingsbarn) {
                return "Basert på informasjonen som ble lagt inn ble det foreslått av beregningen å fatte vedtak for revurderingsbarna. ";
            } else {
                return "Basert på informasjonen som ble lagt inn ble det foreslått av beregningen å ikke fatte vedtak for revurderingsbarna.";
            }
        }
        if (skalFatteVedtakForRevurderingsbarn) {
            return "Basert på informasjonen som er lagt inn foreslår beregningen å fatte vedtak for revurderingsbarna. Ønsker du likevel å overstyre forslaget kan du gjøre dette via bryteren nedenfor. ";
        } else {
            return "Basert på informasjonen som er lagt inn foreslår beregningen å ikke fatte vedtak for revurderingsbarna. Ønsker du likevel å overstyre forslaget kan du gjøre dette via bryteren nedenfor.";
        }
    }
    if (!kanFatteVedtakForRevurderingsbarn && !manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse) return null;

    return (
        <Box className="mb-4">
            <Alert variant="info" size="small" className="mb-4">
                <Heading size="xsmall">
                    {skalFatteVedtakForRevurderingsbarn
                        ? "[Beregningen] fatter vedtak for revurderingsbarna"
                        : "[Beregningen] fatter ikke vedtak for revurderingsbarna"}
                </Heading>
                <BodyShort size="small" className="">
                    {renderInfoText()}
                </BodyShort>
            </Alert>
            <Box background="neutral-soft" padding="space-8" className="mb-4 mt-4">
                <Switch checked={overstyrtFatteVedtak} readOnly={erLesemodus} onChange={handleToggle} size="small">
                    {skalFatteVedtakForRevurderingsbarn
                        ? "Overstyr beregningen: Jeg vil ikke fatte vedtak for revurderingsbarna"
                        : "Overstyr beregningen: Jeg vil fatte vedtak for revurderingsbarna"}
                </Switch>

                {overstyrtFatteVedtak && (
                    <Textarea
                        value={begrunnelse}
                        onChange={handleBegrunnelseChange}
                        label={`Begrunnelse for hvorfor det ${skalFatteVedtakForRevurderingsbarn ? "ikke" : ""} fattes vedtak for revurderingsbarna`}
                        readOnly={erLesemodus}
                        description={
                            skalFatteVedtakForRevurderingsbarn
                                ? "Du må forklare hvorfor du ikke fatter vedtak for revurderingsbarna"
                                : "Du må forklare hvorfor du fatter vedtak for revurderingsbarna"
                        }
                        placeholder="Skriv begrunnelsen her..."
                        size="small"
                        className="mt-3"
                        error={showValidationError ? "Du må skrive en begrunnelse" : undefined}
                    />
                )}
            </Box>
        </Box>
    );
};
