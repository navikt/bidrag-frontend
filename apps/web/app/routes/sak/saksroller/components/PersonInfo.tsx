import { IdentUtils, PersonIdent, PersonNavnIdent, RolleTag, type RolleType } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { BodyShort, HStack, Link, Loader } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { useRouteLoaderData } from "react-router";

import { useHentPersonData, useHentSamhandler } from "~/api/useApi.ts";
import type { loader as rootLoader } from "~/root.tsx";
import type { RolleType as SaksrolleType } from "../sakvisning-schema.ts";

type Props = {
    navn?: string;
    ident: string;
    fødselsdato?: string;
    alder?: number;
    rolle?: SaksrolleType;
    stønad18År?: boolean;
    tags?: ReactNode;
    headingActions?: ReactNode;
    visModiaLenke?: boolean;
    /** Innhold som skal ligge innrykket under navnelinjen, på linje med teksten og ikke rolletaggen. */
    children?: ReactNode;
};

function ModiaLenke({ ident }: { ident: string }) {
    const { modiaUrl } = useRouteLoaderData<typeof rootLoader>("root") ?? {};

    if (!modiaUrl) {
        return null;
    }

    return (
        <Link
            href={`${modiaUrl}/person?sokFnr=${ident}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Åpne personen i Modia"
        >
            Modia <ExternalLinkIcon aria-hidden />
        </Link>
    );
}

function PersonInfoContent({
    navn,
    ident,
    fødselsdato,
    alder,
    rolle,
    stønad18År,
    tags,
    headingActions,
    visModiaLenke,
    children,
}: Props) {
    const { data } = useHentPersonData(ident);
    const erSamhandlerIdent = IdentUtils.isSamhandlerId(ident);
    const { data: samhandlerData } = useHentSamhandler(ident, erSamhandlerIdent);
    const fødselsdatoPerson = fødselsdato ?? data?.fødselsdato;
    const personAlder = alder ?? (fødselsdatoPerson ? beregnAlder(fødselsdatoPerson) : undefined);

    return (
        <HStack gap="space-8" align="start" wrap={false}>
            {rolle && <RolleTag rolleType={rolle as RolleType} ident={ident} stønad18År={stønad18År} />}

            <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {!erSamhandlerIdent && (
                        <BodyShort
                            size="small"
                            weight="semibold"
                            className="personnavn min-w-0 truncate"
                            title={data?.visningsnavn ?? navn}
                        >
                            {data?.visningsnavn ?? navn}
                        </BodyShort>
                    )}
                    {visModiaLenke && !erSamhandlerIdent && <ModiaLenke ident={ident} />}
                    {tags}
                    {headingActions}
                </div>

                <BodyShort textColor="subtle" className="flex items-center" size="small">
                    {erSamhandlerIdent ? (
                        <HStack gap="space-1">
                            <BodyShort size="small" className="personnavn">
                                {navn ?? samhandlerData?.navn}
                            </BodyShort>
                            <div className="flex flex-row">
                                <Link href={`/samhandler/${ident}`} target="_blank" rel="noopener noreferrer">
                                    <PersonIdent ident={ident} />
                                </Link>
                            </div>
                        </HStack>
                    ) : (
                        <PersonNavnIdent variant="ident" showCopyButton={true} ident={ident} />
                    )}

                    {personAlder !== undefined && ` (${personAlder} år)`}
                </BodyShort>

                {children}
            </div>
        </HStack>
    );
}

export default function PersonInfo(props: Props) {
    return (
        <Suspense fallback={<Loader size="xsmall" />}>
            <PersonInfoContent {...props} />
        </Suspense>
    );
}
