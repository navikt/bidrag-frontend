import { RedirectTo } from "@bidrag/common";
import { ExclamationmarkTriangleIcon, FloppydiskIcon } from "@navikt/aksel-icons";
import { BodyLong, Button, Dialog, HStack, InlineMessage, LocalAlert } from "@navikt/ds-react";
import { type RefObject, useEffect, useState } from "react";
import { useRouteLoaderData } from "react-router";

import type { loader as rootLoader } from "~/root.tsx";

type Lagrehandling = "nySoknad" | "gaaTilSak" | "bliVaerende";

export default function SakButtons({
    onSubmit,
    onRefetch,
    feilmelding,
    valideringsFeil,
    harAdvarsel,
    harEndringer,
    suksessmelding,
    statusRef,
    statusResetKey,
}: {
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
    feilmelding?: string | null;
    valideringsFeil?: string | null;
    harAdvarsel: boolean;
    harEndringer: boolean;
    suksessmelding?: string | null;
    statusRef?: RefObject<HTMLDivElement | null>;
    statusResetKey: number;
}) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};
    const [bekreftHandling, setBekreftHandling] = useState<Lagrehandling | null>(null);
    const [ingenEndringer, setIngenEndringer] = useState(false);
    const [lagrer, setLagrer] = useState(false);

    useEffect(() => {
        if (harEndringer) {
            setIngenEndringer(false);
        }
    }, [harEndringer]);

    useEffect(() => {
        setIngenEndringer(false);
    }, [statusResetKey]);

    const lagreNySoknad = async () => {
        const saksnummer = await onSubmit();
        RedirectTo.nySoknad(saksnummer, bisysUrl);
    };

    const lagreOgGaaTilSak = async () => {
        const saksnummer = await onSubmit();
        RedirectTo.behandleSak(saksnummer, bisysUrl);
    };

    const lagreOgBliVaerende = async () => {
        await onSubmit();
        await onRefetch();
    };

    const velgLagrehandling = (handling: Lagrehandling, lagre: () => Promise<void>) => {
        if (lagrer) {
            return;
        }

        if (!harEndringer) {
            setIngenEndringer(true);
            return;
        }

        if (harAdvarsel) {
            setBekreftHandling(handling);
            return;
        }

        void (async () => {
            setLagrer(true);
            try {
                await lagre();
            } catch {
                return;
            } finally {
                setLagrer(false);
            }
        })();
    };

    const bekreftLagring = async () => {
        if (lagrer) {
            return;
        }

        setLagrer(true);
        try {
            if (bekreftHandling === "nySoknad") {
                await lagreNySoknad();
            } else if (bekreftHandling === "gaaTilSak") {
                await lagreOgGaaTilSak();
            } else {
                await lagreOgBliVaerende();
            }
            setBekreftHandling(null);
        } catch {
            return;
        } finally {
            setLagrer(false);
        }
    };

    return (
        <>
            {suksessmelding && (
                <div ref={statusRef} tabIndex={-1}>
                    <LocalAlert status="success">
                        <LocalAlert.Header>
                            <LocalAlert.Title>{suksessmelding}</LocalAlert.Title>
                        </LocalAlert.Header>
                    </LocalAlert>
                </div>
            )}
            {ingenEndringer && !harEndringer && <InlineMessage status="info">Ingen endringer å lagre.</InlineMessage>}
            {feilmelding && (
                <LocalAlert status="error" ref={statusRef} tabIndex={-1}>
                    <LocalAlert.Header>
                        <LocalAlert.Title>{feilmelding}</LocalAlert.Title>
                    </LocalAlert.Header>
                </LocalAlert>
            )}
            {valideringsFeil && (
                <LocalAlert status="error" as="div">
                    <LocalAlert.Header>
                        <LocalAlert.Title>{valideringsFeil}</LocalAlert.Title>
                    </LocalAlert.Header>
                </LocalAlert>
            )}

            <HStack justify="end" gap="space-8">
                <Button
                    type="button"
                    variant="tertiary"
                    size="xsmall"
                    title="Lagre og gå til ny søknad skjermbildet"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    onClick={() => velgLagrehandling("nySoknad", lagreNySoknad)}
                >
                    Lagre og ny søknad
                </Button>
                <Button
                    type="button"
                    variant="tertiary"
                    size="xsmall"
                    title="Lagre og gå tilbake til sak"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    onClick={() => velgLagrehandling("gaaTilSak", lagreOgGaaTilSak)}
                >
                    Lagre og gå til sak
                </Button>
                <Button
                    type="button"
                    size="xsmall"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    onClick={() => velgLagrehandling("bliVaerende", lagreOgBliVaerende)}
                >
                    Lagre
                </Button>
            </HStack>

            {bekreftHandling && (
                <Dialog
                    open
                    onOpenChange={(open) => {
                        if (!open && !lagrer) {
                            setBekreftHandling(null);
                        }
                    }}
                >
                    <Dialog.Popup width="small" role="alertdialog" aria-label="Bekreft lagring av saksroller">
                        <Dialog.Header>
                            <Dialog.Title className="flex items-center gap-2 text-ax-warning-900">
                                <ExclamationmarkTriangleIcon aria-hidden fontSize="1.25rem" />
                                Advarsel
                            </Dialog.Title>
                            <Dialog.Description>
                                Det finnes en relasjonsadvarsel. Kontroller før du lagrer endringene.
                            </Dialog.Description>
                        </Dialog.Header>
                        <Dialog.Body>
                            {feilmelding && (
                                <LocalAlert status="error" size="small">
                                    <LocalAlert.Header>
                                        <LocalAlert.Title>{feilmelding}</LocalAlert.Title>
                                    </LocalAlert.Header>
                                </LocalAlert>
                            )}
                            {!feilmelding && (
                                <BodyLong size="small">Du kan fortsatt lagre hvis dette er forventet.</BodyLong>
                            )}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button type="button" size="small" loading={lagrer} onClick={() => void bekreftLagring()}>
                                Lagre
                            </Button>
                            <Button
                                type="button"
                                size="small"
                                variant="secondary"
                                disabled={lagrer}
                                onClick={() => setBekreftHandling(null)}
                            >
                                Avbryt
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Popup>
                </Dialog>
            )}
        </>
    );
}
