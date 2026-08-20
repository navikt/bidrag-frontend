import { RedirectTo } from "@bidrag/common";
import { FloppydiskIcon } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useRouteLoaderData } from "react-router";

import type { loader as rootLoader } from "~/root.tsx";

export default function SakButtons({
    onSubmit,
    onRefetch,
}: {
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
}) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};

    return (
        <div className="flex justify-end gap-2">
            <Button
                type="button"
                variant="tertiary"
                size="xsmall"
                title="Lagre og gå til ny søknad skjermbildet"
                icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                onClick={async () => {
                    try {
                        const saksnummer = await onSubmit();
                        RedirectTo.nySoknad(saksnummer, bisysUrl);
                    } catch {
                        return;
                    }
                }}
            >
                Lagre og ny søknad
            </Button>
            <Button
                type="button"
                variant="tertiary"
                size="xsmall"
                title="Lagre og gå tilbake til sak"
                icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                onClick={async () => {
                    try {
                        const saksnummer = await onSubmit();
                        RedirectTo.behandleSak(saksnummer, bisysUrl);
                    } catch {
                        return;
                    }
                }}
            >
                Lagre og gå til sak
            </Button>
            <Button
                type="button"
                size="xsmall"
                icon={<FloppydiskIcon title="lagre" fontSize="1.5rem" />}
                onClick={async () => {
                    try {
                        await onSubmit();
                        await onRefetch();
                    } catch {
                        return;
                    }
                }}
            >
                Lagre
            </Button>
        </div>
    );
}
