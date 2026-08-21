import { useSamhandlerReellMottakerHandling } from "../hooks/useSamhandlerReellMottakerHandling.ts";
import PersonSamhandlerSok from "./PersonSamhandlerSok.tsx";

export default function ReellMottakerSøk({
    barnIndex,
    valgtSamhandlerId,
    onSelect,
    onVelg,
}: {
    barnIndex?: number;
    valgtSamhandlerId?: string;
    onSelect?: () => void;
    /** Når satt, rapporteres valget hit i stedet for å skrives rett til skjemaet. */
    onVelg?: (ident: string, navn?: string) => void;
}) {
    const { leggTilSamhandler } = useSamhandlerReellMottakerHandling();

    return (
        <PersonSamhandlerSok
            valgIdent={valgtSamhandlerId}
            onResult={(data) => {
                if (onVelg) {
                    // Samhandlertreff kommer med samhandlerId/offentligId i tillegg til ident.
                    const treff = data as typeof data & { samhandlerId?: string; offentligId?: string };
                    onVelg(treff.samhandlerId ?? treff.ident ?? treff.offentligId ?? "", treff.navn ?? undefined);
                } else {
                    leggTilSamhandler({ ...data, barnIndex });
                }
                onSelect?.();
            }}
            visSamhandlerSøk
            primary={false}
            compact
        />
    );
}
