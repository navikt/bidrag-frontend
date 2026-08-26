import PersonSamhandlerSøk from "./PersonSamhandlerSøk.tsx";

export default function ReellMottakerSøk({
    valgtSamhandlerId,
    onVelg,
}: {
    valgtSamhandlerId?: string;
    onVelg: (ident: string, navn?: string) => void;
}) {
    return (
        <PersonSamhandlerSøk
            valgIdent={valgtSamhandlerId}
            onResult={(data) => {
                const treff = data as typeof data & { samhandlerId?: string; offentligId?: string };
                onVelg(treff.samhandlerId ?? treff.ident ?? treff.offentligId ?? "", treff.navn ?? undefined);
            }}
            visSamhandlerSøk
            primary={false}
            compact
        />
    );
}
