import { useSamhandlerReellMottakerHandling } from "../hooks/useSamhandlerReellMottakerHandling.ts";
import PersonSamhandlerSok from "./PersonSamhandlerSok.tsx";

export default function ReellMottakerSøk({
    barnIndex,
    valgtSamhandlerId,
    onSelect,
}: {
    barnIndex?: number;
    valgtSamhandlerId?: string;
    onSelect?: () => void;
}) {
    const { leggTilSamhandler } = useSamhandlerReellMottakerHandling();

    return (
        <PersonSamhandlerSok
            valgIdent={valgtSamhandlerId}
            onResult={(data) => {
                leggTilSamhandler({ ...data, barnIndex });
                onSelect?.();
            }}
            visSamhandlerSøk
            compact
        />
    );
}
