import { FloppydiskIcon } from "@navikt/aksel-icons";
import { Button, HStack, InlineMessage, LocalAlert } from "@navikt/ds-react";
import { type RefObject, useEffect, useState } from "react";

import { gåTilBisys } from "../felles/bisys-lenker";

type Lagrehandling = "nySoknad" | "gaaTilSak" | "bliVaerende";

export type SakButtonsProps = {
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
    feilmelding?: string | null;
    valideringsFeil?: string | null;
    krevBekreftelse: () => boolean;
    harEndringer: boolean;
    lasterRelasjoner?: boolean;
    suksessmelding?: string | null;
    statusRef?: RefObject<HTMLDivElement | null>;
    statusResetKey: number;
};

function useSakLagring({
    onSubmit,
    onRefetch,
    krevBekreftelse,
    harEndringer,
    lasterRelasjoner,
    statusResetKey,
}: Pick<
    SakButtonsProps,
    "onSubmit" | "onRefetch" | "krevBekreftelse" | "harEndringer" | "lasterRelasjoner" | "statusResetKey"
>) {
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
        nySoknad: async () => gåTilBisys("soknad", await onSubmit()),
        gaaTilSak: async () => gåTilBisys("sak", await onSubmit()),
        bliVaerende: async () => {
            await onSubmit();
            await onRefetch();
        },
    };

    const lagre = async (handling: Lagrehandling) => {
        if (lagrer || lasterRelasjoner) return;
        setLagrer(true);
        try {
            await lagrehandlinger[handling]();
        } catch {
            return;
        } finally {
            setLagrer(false);
        }
    };

    const velgLagrehandling = (handling: Lagrehandling) => {
        if (lagrer || lasterRelasjoner) return;
        if (!harEndringer) {
            setIngenEndringer(true);
        } else if (krevBekreftelse()) {
            void lagre(handling);
        }
    };

    return { lagrer, ingenEndringer, velgLagrehandling };
}

export default function SakButtons({
    onSubmit,
    onRefetch,
    feilmelding,
    valideringsFeil,
    krevBekreftelse,
    harEndringer,
    lasterRelasjoner,
    suksessmelding,
    statusRef,
    statusResetKey,
}: SakButtonsProps) {
    const { lagrer, ingenEndringer, velgLagrehandling } = useSakLagring({
        onSubmit,
        onRefetch,
        krevBekreftelse,
        harEndringer,
        lasterRelasjoner,
        statusResetKey,
    });

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
                    disabled={lasterRelasjoner || lagrer}
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
                    disabled={lasterRelasjoner || lagrer}
                    onClick={() => velgLagrehandling("gaaTilSak")}
                >
                    Lagre og gå til sak
                </Button>
                <Button
                    type="button"
                    size="xsmall"
                    icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                    disabled={lasterRelasjoner || lagrer}
                    onClick={() => velgLagrehandling("bliVaerende")}
                >
                    Lagre
                </Button>
            </HStack>
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
