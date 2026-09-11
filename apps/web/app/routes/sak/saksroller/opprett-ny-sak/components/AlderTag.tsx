import { Tag } from "@navikt/ds-react";

import { MYNDYG_BARN_ALDER } from "../opprett-sak-schema";

type Props = {
    alder: number;
    deaktivert: boolean;
    erMyndig?: boolean;
};

export default function AlderTag({ erMyndig, alder, deaktivert }: Props) {
    if (Number.isNaN(alder)) {
        return null;
    }

    const alderTagVariant = deaktivert ? "neutral" : erMyndig || alder >= MYNDYG_BARN_ALDER ? "warning" : "success";

    return (
        <Tag variant={alderTagVariant} size="xsmall">
            {alder} år
        </Tag>
    );
}
