import { TilgangsFeilError } from "@bidrag/api";
import { RedirectTo } from "@bidrag/common";
import { TasklistSaveIcon, TasklistSendIcon, TasklistStartIcon } from "@navikt/aksel-icons";
import { Alert, Button, HStack, VStack } from "@navikt/ds-react";
import type { AxiosError } from "axios";
import { type MouseEvent, type RefObject, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useRouteLoaderData, useSearchParams } from "react-router";
import type { loader as rootLoader } from "~/root.tsx";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";

type Props = {
    blocked?: boolean;
    isLoading?: boolean;
    error?: AxiosError<string> | TilgangsFeilError | null;
    saksnummer?: string | null;
};

type Redirectmål = "sak" | "soknad" | null;

function feilmeldingTekst(error: Props["error"]) {
    if (error instanceof TilgangsFeilError) return error.message;
    return error?.response?.data || "Kunne ikke opprette sak";
}

function useRedirectEtterOpprettelse(saksnummer: string | null | undefined, redirectmål: RefObject<Redirectmål>) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};
    const [, setSearchParams] = useSearchParams();
    const { onOpprettet } = useSaksrolleroversikt();
    const onOpprettetRef = useRef(onOpprettet);
    onOpprettetRef.current = onOpprettet;

    useEffect(() => {
        if (!saksnummer) return;

        if (redirectmål.current === "sak") {
            RedirectTo.behandleSak(saksnummer, bisysUrl);
        } else if (redirectmål.current === "soknad") {
            RedirectTo.nySoknad(saksnummer, bisysUrl);
        } else if (onOpprettetRef.current) {
            onOpprettetRef.current(saksnummer);
        } else {
            setSearchParams(
                (forrige) => {
                    forrige.set("saksnummer", saksnummer);
                    return forrige;
                },
                { replace: true },
            );
        }
    }, [saksnummer, bisysUrl, setSearchParams]);
}

export default function SubmitButtons({ blocked = false, isLoading = false, error, saksnummer }: Props) {
    const errorRef = useRef<HTMLDivElement>(null);
    const afterSubmitRedirect = useRef<Redirectmål>(null);
    const [blockedError, setBlockedError] = useState<string | null>(null);
    const form = useFormContext();
    const { onAvbryt } = useSaksrolleroversikt();
    const visFeil = Boolean(error || blockedError);

    useRedirectEtterOpprettelse(saksnummer, afterSubmitRedirect);

    useEffect(() => {
        if (visFeil && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            errorRef.current.focus();
        }
    }, [error, blockedError]);

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
            setBlockedError("Kan ikke opprette saken ennå. Kontroller feltene og meldingene over.");
            return;
        }
        setBlockedError(null);
        afterSubmitRedirect.current = handling;
    };

    return (
        <VStack gap="space-8">
            {visFeil && (
                <Alert variant="error" ref={errorRef} tabIndex={-1}>
                    {blockedError ?? feilmeldingTekst(error)}
                </Alert>
            )}
            {saksnummer ? (
                <Alert variant="success" size="small" role="status">
                    {afterSubmitRedirect.current
                        ? `Sak opprettet med saksnummer ${saksnummer}. Omdirigerer...`
                        : `Sak opprettet med saksnummer ${saksnummer}.`}
                </Alert>
            ) : (
                <Opprettknapper isLoading={isLoading} onVelg={velgHandling} onAvbryt={onAvbryt} />
            )}
        </VStack>
    );
}

function Opprettknapper({
    isLoading,
    onVelg,
    onAvbryt,
}: {
    isLoading: boolean;
    onVelg: (event: MouseEvent<HTMLButtonElement>, handling: Redirectmål) => void;
    onAvbryt?: () => void;
}) {
    return (
        <HStack gap="space-2" justify="end">
            {onAvbryt && (
                <Button variant="tertiary-neutral" type="button" size="xsmall" disabled={isLoading} onClick={onAvbryt}>
                    Avbryt
                </Button>
            )}
            <Button
                variant="tertiary"
                type="submit"
                size="xsmall"
                title="Opprett sak og gå til ny søknad skjermbildet"
                icon={<TasklistStartIcon title="lagre" fontSize="1.5rem" />}
                loading={isLoading}
                onClick={(event) => onVelg(event, "soknad")}
            >
                Opprett og ny søknad
            </Button>
            <Button
                variant="tertiary"
                type="submit"
                size="xsmall"
                icon={<TasklistSendIcon title="lagre" fontSize="1.5rem" />}
                loading={isLoading}
                title="Opprett og gå til sak"
                onClick={(event) => onVelg(event, "sak")}
            >
                Opprett og gå til sak
            </Button>
            <Button
                variant="primary"
                type="submit"
                size="xsmall"
                title="Opprett sak uten navigering"
                icon={<TasklistSaveIcon title="lagre" fontSize="1.5rem" />}
                loading={isLoading}
                onClick={(event) => onVelg(event, null)}
            >
                Opprett
            </Button>
        </HStack>
    );
}
