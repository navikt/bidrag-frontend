import { dateToDDMMYYYYString, IdentUtils, PersonIdent, PersonNavnIdent } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { BodyShort, HStack, Link, Loader, Tag } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { useHentPersonData, useHentSamhandler } from "~/api/useApi.ts";
import { MYNDYG_BARN_ALDER } from "../sakvisning-schema.ts";

type Props = {
    navn?: string;
    ident: string;
    fødselsdato?: string;
    alder?: number;
    rolle?: string;
    tags?: ReactNode;
};

function PersonInfoContent({ navn, ident, fødselsdato, alder, rolle, tags }: Props) {
    const { data } = useHentPersonData(ident);
    const erSamhandlerIdent = IdentUtils.isSamhandlerId(ident);
    const { data: samhandlerData } = useHentSamhandler(ident, erSamhandlerIdent);
    const hentetFødselsdato = data?.fødselsdato;
    const fødselsdatoPerson = fødselsdato ?? hentetFødselsdato;
    const personAlder = alder ?? (fødselsdatoPerson ? beregnAlder(fødselsdatoPerson) : undefined);
    const alderTagVariant = personAlder !== undefined && personAlder >= MYNDYG_BARN_ALDER ? "warning" : "success";
    const rolleTagVariant = "alt1";

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                {!erSamhandlerIdent && <BodyShort size="small">{data?.visningsnavn ?? navn}</BodyShort>}
                {personAlder !== undefined && (
                    <Tag variant={alderTagVariant} size="xsmall">
                        {personAlder} år
                    </Tag>
                )}
                {rolle && (
                    <Tag variant={rolleTagVariant} size="xsmall">
                        {rolle}
                    </Tag>
                )}
                {tags}
            </div>

            <BodyShort className="text-ax-neutral-800 flex items-center" size="small">
                {erSamhandlerIdent ? (
                    <HStack gap="space-1">
                        <BodyShort size="small">{navn ?? samhandlerData?.navn}</BodyShort>
                        <div className="flex flex-row">
                            <Link href={`/samhandler/${ident}`} target="_blank" rel="noopener noreferrer">
                                <PersonIdent ident={ident} />
                            </Link>
                        </div>
                    </HStack>
                ) : (
                    <PersonNavnIdent variant="ident" showCopyButton={true} ident={ident} />
                )}

                {fødselsdatoPerson && ` / ${dateToDDMMYYYYString(new Date(fødselsdatoPerson))}`}
            </BodyShort>
        </div>
    );
}

export default function PersonInfo(props: Props) {
    return (
        <Suspense fallback={<Loader size="xsmall" />}>
            <PersonInfoContent {...props} />
        </Suspense>
    );
}
