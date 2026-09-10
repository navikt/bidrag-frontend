import { TilgangsFeilError } from "@bidrag/api";
import { RedirectTo } from "@bidrag/common";
import { TasklistSaveIcon, TasklistSendIcon, TasklistStartIcon } from "@navikt/aksel-icons";
import { Alert, Button, HStack } from "@navikt/ds-react";
import type { AxiosError } from "axios";
import { useEffect, useRef } from "react";
import { useRouteLoaderData, useSearchParams } from "react-router";
import type { loader as rootLoader } from "~/root.tsx";

type Props = {
    disabled?: boolean;
    isLoading?: boolean;
    error?: AxiosError<string> | TilgangsFeilError | null;
    saksnummer?: string | null;
};

export default function SubmitButtons({ disabled = false, isLoading = false, error, saksnummer }: Props) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};
    const [, setSearchParams] = useSearchParams();
    const errorRef = useRef<HTMLDivElement>(null);
    const afterSubmitRedirect = useRef<"sak" | "soknad" | null>(null);

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            errorRef.current.focus();
        }
    }, [error]);

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
                    className="self-end"
                    variant="tertiary"
                    type="submit"
                    size="xsmall"
                    title="Opprett sak og gå til ny søknad skjermbildet"
                    icon={<TasklistStartIcon title="lagre" fontSize="1.5rem" />}
                    loading={isLoading}
                    onClick={() => (afterSubmitRedirect.current = "soknad")}
                    disabled={disabled || isLoading}
                >
                    Opprett og ny søknad
                </Button>
                <Button
                    className="self-end"
                    variant="tertiary"
                    type="submit"
                    size="xsmall"
                    icon={<TasklistSendIcon title="lagre" fontSize="1.5rem" />}
                    loading={isLoading}
                    title="Opprett og gå til sak"
                    onClick={() => (afterSubmitRedirect.current = "sak")}
                    disabled={disabled || isLoading}
                >
                    Opprett og gå til sak
                </Button>
                <Button
                    className="self-end"
                    variant="primary"
                    type="submit"
                    size="xsmall"
                    title="Opprett sak uten navigering"
                    icon={<TasklistSaveIcon title="lagre" fontSize="1.5rem" />}
                    loading={isLoading}
                    disabled={disabled || isLoading}
                >
                    Opprett
                </Button>
            </HStack>
        );
    }
    return (
        <div>
            {error && (
                <Alert variant="error" ref={errorRef} tabIndex={-1}>
                    {error instanceof TilgangsFeilError
                        ? error.message
                        : error?.response?.data || "Kunne ikke opprette sak"}
                </Alert>
            )}
            {renderButtons()}
        </div>
    );
}
