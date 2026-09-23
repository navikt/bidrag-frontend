import { TilgangsFeilError } from "@bidrag/api";
import { RedirectTo } from "@bidrag/common";
import { TasklistSaveIcon, TasklistSendIcon, TasklistStartIcon } from "@navikt/aksel-icons";
import { Alert, Button, HStack, VStack } from "@navikt/ds-react";
import type { AxiosError } from "axios";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useRouteLoaderData, useSearchParams } from "react-router";
import type { loader as rootLoader } from "~/root.tsx";

type Props = {
    blocked?: boolean;
    isLoading?: boolean;
    error?: AxiosError<string> | TilgangsFeilError | null;
    saksnummer?: string | null;
};

export default function SubmitButtons({ blocked = false, isLoading = false, error, saksnummer }: Props) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};
    const [, setSearchParams] = useSearchParams();
    const errorRef = useRef<HTMLDivElement>(null);
    const afterSubmitRedirect = useRef<"sak" | "soknad" | null>(null);
    const [blockedError, setBlockedError] = useState<string | null>(null);
    const form = useFormContext();

    useEffect(() => {
        if ((error || blockedError) && errorRef.current) {
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

    useEffect(() => {
        if (!saksnummer) return;

        if (afterSubmitRedirect.current === "sak") {
            RedirectTo.behandleSak(saksnummer, bisysUrl);
        } else if (afterSubmitRedirect.current === "soknad") {
            RedirectTo.nySoknad(saksnummer, bisysUrl);
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

    const velgHandling = (event: MouseEvent<HTMLButtonElement>, handling: "sak" | "soknad" | null) => {
        if (blocked || isLoading || saksnummer) {
            event.preventDefault();
            if (blocked && !isLoading && !saksnummer) {
                setBlockedError("Kan ikke opprette saken ennå. Kontroller feltene og meldingene over.");
            }
            return;
        }
        setBlockedError(null);
        afterSubmitRedirect.current = handling;
    };

    function renderButtons() {
        if (saksnummer && afterSubmitRedirect.current) {
            return (
                <Alert variant="success" size="small">
                    Sak opprettet med saksnummer {saksnummer}! Omdirigerer...
                </Alert>
            );
        }
        return (
            <HStack gap="space-2" justify="end">
                <Button
                    variant="tertiary"
                    type="submit"
                    size="xsmall"
                    title="Opprett sak og gå til ny søknad skjermbildet"
                    icon={<TasklistStartIcon title="lagre" fontSize="1.5rem" />}
                    loading={isLoading}
                    onClick={(event) => velgHandling(event, "soknad")}
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
                    onClick={(event) => velgHandling(event, "sak")}
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
                    onClick={(event) => velgHandling(event, null)}
                >
                    Opprett
                </Button>
            </HStack>
        );
    }
    return (
        <VStack gap="space-8">
            {(error || blockedError) && (
                <Alert variant="error" ref={errorRef} tabIndex={-1}>
                    {blockedError ??
                        (error instanceof TilgangsFeilError
                            ? error.message
                            : error?.response?.data || "Kunne ikke opprette sak")}
                </Alert>
            )}
            {renderButtons()}
        </VStack>
    );
}
