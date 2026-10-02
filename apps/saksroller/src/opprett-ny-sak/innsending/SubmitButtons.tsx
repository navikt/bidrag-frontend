import { TilgangsFeilError } from "@bidrag/api";
import { useNyOpprettSakModal } from "@bidrag/common";
import { Alert, VStack } from "@navikt/ds-react";
import type { AxiosError } from "axios";
import { type MouseEvent, type RefObject, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { gåTilBisys } from "../../felles/bisys-lenker";
import { useOpprettSakStart } from "../skjema/OpprettSakStartContext";
import OpprettSakSideknapper, { type Redirectmål } from "./OpprettSakSideknapper";

type Props = {
    blocked?: boolean;
    isLoading?: boolean;
    error?: AxiosError<string> | TilgangsFeilError | null;
    saksnummer?: string | null;
    harEksisterendeSak?: boolean;
};

function feilmeldingTekst(error: Props["error"]) {
    if (error instanceof TilgangsFeilError) return error.message;
    return error?.response?.data || "Kunne ikke opprette sak";
}

function useRedirectEtterOpprettelse(saksnummer: string | null | undefined, redirectmål: RefObject<Redirectmål>) {
    const navigate = useNavigate();
    const { onOpprettet } = useOpprettSakStart();
    const onOpprettetRef = useRef(onOpprettet);
    onOpprettetRef.current = onOpprettet;

    useEffect(() => {
        if (!saksnummer) return;

        if (onOpprettetRef.current) {
            onOpprettetRef.current(saksnummer);
        } else if (redirectmål.current === "sak") {
            gåTilBisys("sak", saksnummer);
        } else if (redirectmål.current === "soknad") {
            gåTilBisys("soknad", saksnummer);
        } else {
            void navigate(`/sak/${encodeURIComponent(saksnummer)}/saksroller`, { replace: true });
        }
    }, [saksnummer, navigate, redirectmål]);
}

function useSubmitHandling({ blocked = false, isLoading = false, saksnummer, harEksisterendeSak }: Props) {
    const afterSubmitRedirect = useRef<Redirectmål>(null);
    const [blockedError, setBlockedError] = useState<string | null>(null);
    const form = useFormContext();
    const { onAvbryt, onOpprettet } = useOpprettSakStart();
    const modal = useNyOpprettSakModal();

    useRedirectEtterOpprettelse(saksnummer, afterSubmitRedirect);

    useEffect(() => {
        if (!blocked) {
            setBlockedError(null);
        }
    }, [blocked]);

    useEffect(() => {
        const abonnement = form.watch(() => setBlockedError(null));
        return () => abonnement.unsubscribe();
    }, [form]);

    const velgHandling = (event: MouseEvent<HTMLButtonElement>, handling: Redirectmål) => {
        if (isLoading || saksnummer) {
            event.preventDefault();
            return;
        }
        if (blocked) {
            event.preventDefault();
            void form.trigger();
            setBlockedError(
                harEksisterendeSak
                    ? "Kan ikke opprette saken. Det finnes allerede en sak mellom disse partene med samme roller. Åpne saken i varselet over, eller endre en av partene."
                    : "Kan ikke opprette saken ennå. Kontroller feltene og meldingene over.",
            );
            return;
        }
        setBlockedError(null);
        afterSubmitRedirect.current = handling;
    };

    useModalSubmit(modal?.setSubmit, isLoading, saksnummer, velgHandling);

    return { blockedError, afterSubmitRedirect, velgHandling, onAvbryt, onOpprettet, modal };
}

function useModalSubmit(
    setSubmit: NonNullable<ReturnType<typeof useNyOpprettSakModal>>["setSubmit"] | undefined,
    isLoading: boolean,
    saksnummer: Props["saksnummer"],
    velgHandling: (event: MouseEvent<HTMLButtonElement>, handling: Redirectmål) => void,
) {
    const velgHandlingRef = useRef(velgHandling);
    velgHandlingRef.current = velgHandling;
    useEffect(() => {
        if (!setSubmit) return;
        if (saksnummer) {
            setSubmit(null);
            return;
        }
        setSubmit({ isLoading, onClick: (event) => velgHandlingRef.current(event, null) });
        return () => setSubmit(null);
    }, [setSubmit, isLoading, saksnummer]);
}

export default function SubmitButtons({
    blocked = false,
    isLoading = false,
    error,
    saksnummer,
    harEksisterendeSak,
}: Props) {
    const errorRef = useRef<HTMLDivElement>(null);
    const { blockedError, afterSubmitRedirect, velgHandling, onAvbryt, onOpprettet, modal } = useSubmitHandling({
        blocked,
        isLoading,
        saksnummer,
        harEksisterendeSak,
    });
    const visFeil = Boolean(error || blockedError);

    useEffect(() => {
        if (visFeil && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            errorRef.current.focus();
        }
    }, [error, blockedError]);

    return (
        <VStack gap="space-8">
            {visFeil && (
                <Alert variant="error" size="small" ref={errorRef} tabIndex={-1}>
                    {blockedError ?? feilmeldingTekst(error)}
                </Alert>
            )}
            {saksnummer ? (
                <Alert variant="success" size="small" role="status">
                    {!onOpprettet && afterSubmitRedirect.current !== null
                        ? `Sak opprettet med saksnummer ${saksnummer}. Omdirigerer...`
                        : `Sak opprettet med saksnummer ${saksnummer}.`}
                </Alert>
            ) : modal ? null : (
                <OpprettSakSideknapper
                    isLoading={isLoading}
                    onVelg={velgHandling}
                    onAvbryt={onAvbryt}
                    harOnOpprettet={Boolean(onOpprettet)}
                />
            )}
        </VStack>
    );
}
