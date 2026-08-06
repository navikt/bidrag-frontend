import { FloppydiskIcon } from "@navikt/aksel-icons";
import { RedirectTo } from "@bidrag/common";
import { Button } from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";

import { configQuery } from "~/api/query/config.query.ts";

export default function SakButtons({
    onSubmit,
    onRefetch,
}: {
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
}) {
    const { data: config } = useQuery(configQuery);
    const bisysBaseUrl = config?.bisysBaseUrl ?? "";

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
                        RedirectTo.nySoknad(saksnummer, bisysBaseUrl);
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
                        RedirectTo.behandleSak(saksnummer, bisysBaseUrl);
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
