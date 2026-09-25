import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useOppdaterSaksroller } from "~/api/useApi.ts";
import type { SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { finnFørsteValideringsfeil } from "./finn-forste-valideringsfeil.ts";
import { lagOppdaterRollerRequest } from "./lag-oppdater-roller-request.ts";

type SaksrollerStatus = {
    setFeilmelding: (melding: string | null) => void;
    setValideringsFeil: (melding: string | null) => void;
    setSuksessmelding: (melding: string | null) => void;
};

export function useSaksrollerSubmit(
    saksnummer: string,
    formMethods: UseFormReturn<SakRedigeringData>,
    status: SaksrollerStatus,
) {
    const oppdaterSaksrollerMutation = useOppdaterSaksroller();
    const { handleSubmit } = formMethods;
    const { setFeilmelding, setValideringsFeil, setSuksessmelding } = status;

    const onSubmit = useCallback(
        async (data: SakRedigeringData): Promise<string> => {
            try {
                setSuksessmelding(null);
                setFeilmelding(null);
                setValideringsFeil(null);
                oppdaterSaksrollerMutation.reset();

                await oppdaterSaksrollerMutation.mutateAsync(lagOppdaterRollerRequest(data));
                setSuksessmelding("Saken ble oppdatert");
                return saksnummer;
            } catch (err) {
                const axiosError = err as { response?: { data?: string } };
                setFeilmelding(axiosError.response?.data || "Kunne ikke oppdatere sak. Vennligst prøv igjen.");
                throw err;
            }
        },
        [oppdaterSaksrollerMutation, saksnummer, setFeilmelding, setSuksessmelding, setValideringsFeil],
    );

    const handleSubmitAsync = useCallback(
        () =>
            new Promise<string>((resolve, reject) => {
                handleSubmit(
                    async (data) => {
                        try {
                            resolve(await onSubmit(data));
                        } catch (error) {
                            reject(error);
                        }
                    },
                    (errors) => {
                        setValideringsFeil(
                            finnFørsteValideringsfeil(errors) ??
                                "Kan ikke lagre saken. Kontroller feltene som er markert med feil.",
                        );
                        reject(new Error("Validation failed", { cause: errors }));
                    },
                )();
            }),
        [handleSubmit, onSubmit, setValideringsFeil],
    );

    return {
        handleSubmitAsync,
        isPending: oppdaterSaksrollerMutation.isPending,
    };
}
