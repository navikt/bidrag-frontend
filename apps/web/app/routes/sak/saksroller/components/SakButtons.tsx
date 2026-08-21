import { RedirectTo } from "@bidrag/common";
import { FloppydiskIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, Button, Heading, Modal } from "@navikt/ds-react";
import { type RefObject, useEffect, useState } from "react";
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
    const [lagrer, setLagrer] = useState(false);
    const [ingenEndringer, setIngenEndringer] = useState(false);

    useEffect(() => {
        if (harEndringer) {
            setIngenEndringer(false);
        }
    }, [harEndringer]);

    const lagre = async (handling: Lagrehandling) => {
        setLagrer(true);
        try {
            const saksnummer = await onSubmit();
            setBekreftHandling(null);

            if (handling === "nySoknad") {
                RedirectTo.nySoknad(saksnummer, bisysUrl);
                return;
            }
            if (handling === "gaaTilSak") {
                RedirectTo.behandleSak(saksnummer, bisysUrl);
                return;
            }
            await onRefetch();
        } catch {
            return;
        } finally {
            setLagrer(false);
        }
    };

    const velgLagrehandling = (handling: Lagrehandling) => {
        if (!harEndringer) {
            setIngenEndringer(true);
            return;
        }

        if (harAdvarsel) {
            setBekreftHandling(handling);
            return;
        }

        void lagre(handling);
    };

    return (
        <>
            {suksessmelding && (
                <div ref={statusRef} tabIndex={-1}>
                    <Alert variant="success">{suksessmelding}</Alert>
                </div>
            )}
            {ingenEndringer && <Alert variant="info">Ingen endringer å lagre.</Alert>}
            {feilmelding && !bekreftHandling && <Alert variant="error">{feilmelding}</Alert>}

            <div className="flex justify-end gap-2">
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
            </div>

            {bekreftHandling && (
                <Modal
                    open
                    onClose={() => setBekreftHandling(null)}
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
                        <Button type="button" loading={lagrer} onClick={() => lagre(bekreftHandling)}>
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
