import { RedirectTo } from "@bidrag/common";
import { FloppydiskIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, Button, Heading, Modal } from "@navikt/ds-react";
import { type RefObject, useState } from "react";
import { useRouteLoaderData } from "react-router";

import type { loader as rootLoader } from "~/root.tsx";

type Lagrehandling = "nySoknad" | "gaaTilSak" | "bliVaerende";

export default function SakButtons({
    onSubmit,
    onRefetch,
    feilmelding,
    harAdvarsel,
    harEndringer,
    suksessmelding,
    statusRef,
}: {
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
    feilmelding?: string | null;
    harAdvarsel: boolean;
    harEndringer: boolean;
    suksessmelding?: string | null;
    statusRef?: RefObject<HTMLDivElement | null>;
}) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};
    const [bekreftHandling, setBekreftHandling] = useState<Lagrehandling | null>(null);
    const [ingenEndringer, setIngenEndringer] = useState(false);
    const [lagrer, setLagrer] = useState(false);

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
                    <Alert variant="success">{suksessmelding}</Alert>
                </div>
            )}
            {ingenEndringer && !harEndringer && <Alert variant="info">Ingen endringer å lagre.</Alert>}
            {feilmelding && <Alert variant="error">{feilmelding}</Alert>}

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="tertiary"
                    size="xsmall"
                    title="Lagre og gå til ny søknad skjermbildet"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    disabled={lagrer}
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
                    disabled={lagrer}
                    onClick={() => velgLagrehandling("gaaTilSak", lagreOgGaaTilSak)}
                >
                    Lagre og gå til sak
                </Button>
                <Button
                    type="button"
                    size="xsmall"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    disabled={lagrer}
                    onClick={() => velgLagrehandling("bliVaerende", lagreOgBliVaerende)}
                >
                    Lagre
                </Button>
            </div>

            {bekreftHandling && (
                <Modal
                    open
                    onClose={() => {
                        if (!lagrer) {
                            setBekreftHandling(null);
                        }
                    }}
                    width="small"
                    aria-label="Bekreft lagring av saksroller"
                >
                    <Modal.Header>
                        <Heading level="2" size="medium">
                            Lagre selv om det finnes en advarsel?
                        </Heading>
                    </Modal.Header>
                    <Modal.Body>
                        {feilmelding && <Alert variant="error">{feilmelding}</Alert>}
                        <BodyLong>Kontroller relasjonsadvarselen før du lagrer endringene.</BodyLong>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="button" loading={lagrer} disabled={lagrer} onClick={() => void bekreftLagring()}>
                            Lagre
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={lagrer}
                            onClick={() => setBekreftHandling(null)}
                        >
                            Avbryt
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
}
