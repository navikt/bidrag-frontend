import { RedirectTo } from "@bidrag/common";
import { ExclamationmarkTriangleIcon, FloppydiskIcon } from "@navikt/aksel-icons";
import { BodyLong, Button, Dialog, HStack, InlineMessage, LocalAlert } from "@navikt/ds-react";
import { type RefObject, useEffect, useState } from "react";
import { useRouteLoaderData } from "react-router";

import type { loader as rootLoader } from "~/root.tsx";

type Lagrehandling = "nySoknad" | "gaaTilSak" | "bliVaerende";

export type SakButtonsProps = {
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
    feilmelding?: string | null;
    valideringsFeil?: string | null;
    harAdvarsel: boolean;
    harEndringer: boolean;
    suksessmelding?: string | null;
    statusRef?: RefObject<HTMLDivElement | null>;
    statusResetKey: number;
};

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
}: SakButtonsProps) {
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

    const lagrehandlinger: Record<Lagrehandling, () => Promise<void>> = {
        nySoknad: async () => RedirectTo.nySoknad(await onSubmit(), bisysUrl),
        gaaTilSak: async () => RedirectTo.behandleSak(await onSubmit(), bisysUrl),
        bliVaerende: async () => {
            await onSubmit();
            await onRefetch();
        },
    };

    const lagre = async (handling: Lagrehandling) => {
        setLagrer(true);
        try {
            await lagrehandlinger[handling]();
            setBekreftHandling(null);
        } catch {
            return;
        } finally {
            setLagrer(false);
        }
    };

    const velgLagrehandling = (handling: Lagrehandling) => {
        if (lagrer) return;
        if (!harEndringer) {
            setIngenEndringer(true);
        } else if (harAdvarsel) {
            setBekreftHandling(handling);
        } else {
            void lagre(handling);
        }
    };

    return (
        <>
            <Statusmeldinger
                suksessmelding={suksessmelding}
                visIngenEndringer={ingenEndringer && !harEndringer}
                feilmelding={feilmelding}
                valideringsFeil={valideringsFeil}
                statusRef={statusRef}
            />

            <HStack justify="end" gap="space-8">
                <Button
                    type="button"
                    variant="tertiary"
                    size="xsmall"
                    title="Lagre og gå til ny søknad skjermbildet"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    onClick={() => velgLagrehandling("nySoknad")}
                >
                    Lagre og ny søknad
                </Button>
                <Button
                    type="button"
                    variant="tertiary"
                    size="xsmall"
                    title="Lagre og gå tilbake til sak"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    onClick={() => velgLagrehandling("gaaTilSak")}
                >
                    Lagre og gå til sak
                </Button>
                <Button
                    type="button"
                    size="xsmall"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    onClick={() => velgLagrehandling("bliVaerende")}
                >
                    Lagre
                </Button>
            </HStack>

            {bekreftHandling && (
                <BekreftLagringDialog
                    feilmelding={feilmelding}
                    lagrer={lagrer}
                    onBekreft={() => {
                        if (!lagrer) void lagre(bekreftHandling);
                    }}
                    onAvbryt={() => setBekreftHandling(null)}
                />
            )}
        </>
    );
}

function Statusmeldinger({
    suksessmelding,
    visIngenEndringer,
    feilmelding,
    valideringsFeil,
    statusRef,
}: {
    suksessmelding?: string | null;
    visIngenEndringer: boolean;
    feilmelding?: string | null;
    valideringsFeil?: string | null;
    statusRef?: RefObject<HTMLDivElement | null>;
}) {
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
            {visIngenEndringer && <InlineMessage status="info">Ingen endringer å lagre.</InlineMessage>}
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
        </>
    );
}

function BekreftLagringDialog({
    feilmelding,
    lagrer,
    onBekreft,
    onAvbryt,
}: {
    feilmelding?: string | null;
    lagrer: boolean;
    onBekreft: () => void;
    onAvbryt: () => void;
}) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !lagrer) {
                    onAvbryt();
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
                    {feilmelding ? (
                        <LocalAlert status="error" size="small">
                            <LocalAlert.Header>
                                <LocalAlert.Title>{feilmelding}</LocalAlert.Title>
                            </LocalAlert.Header>
                        </LocalAlert>
                    ) : (
                        <BodyLong size="small">Du kan fortsatt lagre hvis dette er forventet.</BodyLong>
                    )}
                </Dialog.Body>
                <Dialog.Footer>
                    <Button type="button" size="small" loading={lagrer} onClick={onBekreft}>
                        Lagre
                    </Button>
                    <Button type="button" size="small" variant="secondary" onClick={onAvbryt}>
                        Avbryt
                    </Button>
                </Dialog.Footer>
            </Dialog.Popup>
        </Dialog>
    );
}
