import type { ISamhandlerPersonInfo, Mottakertype } from "../../api/samhandler.api";
import PersonSamhandlerSøk from "../person-søk/PersonSamhandlerSøk.tsx";

export default function ReellMottakerSøk({
    valgtSamhandlerId,
    onVelg,
    onError,
}: {
    valgtSamhandlerId?: string;
    onVelg: (ident: string, navn?: string, mottakertype?: Mottakertype) => void;
    onError: (feil: string) => void;
}) {
    return (
        <PersonSamhandlerSøk
            valgIdent={valgtSamhandlerId}
            onResult={(data: ISamhandlerPersonInfo) => {
                onVelg(data.ident, data.navn ?? undefined, data.mottakertype);
            }}
            onError={onError}
            inkluderSamhandler
            tømVedTreff
        />
    );
}
