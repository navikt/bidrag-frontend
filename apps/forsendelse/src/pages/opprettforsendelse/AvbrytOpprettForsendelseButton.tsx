import { Button } from "@navikt/ds-react";

import { RedirectTo } from "../../utils/RedirectUtils";
import { useSession } from "../forsendelse/context/SessionContext";

type AvbrytOpprettForsendelseButton = {
    disabled?: boolean;
};
export default function AvbrytOpprettForsendelseButton({ disabled }: AvbrytOpprettForsendelseButton) {
    const { saksnummer } = useSession();
    return (
        <Button
            size="small"
            variant="tertiary"
            type="button"
            onClick={() => RedirectTo.sakshistorikk(saksnummer)}
            disabled={disabled}
        >
            Avbryt
        </Button>
    );
}
