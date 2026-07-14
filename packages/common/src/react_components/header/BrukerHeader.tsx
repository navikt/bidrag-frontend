import {Bleed, BodyShort, CopyButton} from "@navikt/ds-react";
import {PersonDto} from "@bidrag/api/PersonApi";

interface ISkjermbildeDetaljer {
    navn: string;
    referanse: string | number;
}

interface ISakHeaderProps {
    bruker: PersonDto;
    skjermbilde?: ISkjermbildeDetaljer;
}

export default function BrukerHeader({bruker, skjermbilde}: ISakHeaderProps) {
    return (
        <Bleed marginInline="full">
            <div className="bg-(--ax-neutral-100) border-(--ax-border-neutral-subtle) border-solid border-b w-full border-0">
                <div className="px-6 py-1 flex items-center border-(--ax-border-neutral-subtle) border-solid border-b border-0">
                    <SkjermbildeDetaljer bruker={bruker} skjermbilde={skjermbilde}/>
                </div>
            </div>
        </Bleed>
    );
}

function SkjermbildeDetaljer({bruker, skjermbilde}: { bruker: PersonDto; skjermbilde?: ISkjermbildeDetaljer }) {
    return (
        <div className="flex flex-row">
            <span className="text-base flex items-center font-normal">
                <BodyShort size={"small"} className="saksnr">
                    Bruker. {bruker.visningsnavn}: {bruker.ident}
                </BodyShort>
                <CopyButton size="small" copyText={bruker.ident} activeText="Kopierte ident"/>
            </span>
            {skjermbilde && (
                <>
                    <div className="mx-1 self-center">/</div>
                    <span className="text-base flex items-center font-normal">
                        <BodyShort size={"small"}>
                            {skjermbilde.navn} {skjermbilde.referanse}
                        </BodyShort>
                        <CopyButton size="small" copyText={skjermbilde.referanse?.toString()} activeText="Kopiert"/>
                    </span>
                </>
            )}
        </div>
    );
}
