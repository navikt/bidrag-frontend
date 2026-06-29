import { Bleed, BodyShort, Box, CopyButton, HStack, VStack } from "@navikt/ds-react";
import type { IRolleDetaljer } from "../../types/roller/IRolleDetaljer";
import { RolleTypeAbbreviation, RolleTypeDeprecated, RolleTypeFullName } from "../../types/roller/RolleType";
import RolleDetaljer from "../roller/RolleDetaljer2";

interface ISkjermbildeDetaljer {
    navn: string;
    referanse: string | number;
}

interface ISakHeaderProps {
    saksnummer: string;
    roller: IRolleDetaljer[];
    skjermbilde?: ISkjermbildeDetaljer;
}

export default function SakHeader({ saksnummer, roller, skjermbilde }: ISakHeaderProps) {
    return (
        <Bleed asChild marginInline="full">
            <Box background="neutral-moderate" borderWidth="0 0 1 0" borderColor="neutral-subtle">
                <Box paddingInline="space-24" paddingBlock="space-4" borderWidth="0 0 1 0" borderColor="neutral-subtle">
                    <HStack align="center">
                        <SkjermbildeDetaljer saksnummer={saksnummer} skjermbilde={skjermbilde} />
                    </HStack>
                </Box>
                <HStack wrap gap="space-4">
                    {roller
                        ?.filter((r) => r.rolleType !== RolleTypeAbbreviation.BA && r.rolleType !== RolleTypeFullName.BARN)
                        ?.sort((a, b) =>
                            a.rolleType === RolleTypeAbbreviation.BM || a.rolleType === RolleTypeDeprecated.BIDRAGS_MOTTAKER ? 1 : -1,
                        )
                        .map((rolle, i) => (
                            <RolleDetaljer key={rolle.ident + i} rolle={rolle} withBorder={false} stønad18År={rolle.stønad18År} />
                        ))}
                    {roller
                        ?.filter((r) => r.rolleType === RolleTypeAbbreviation.BA || r.rolleType === RolleTypeFullName.BARN)
                        .map((rolle, i) => (
                            <RolleDetaljer key={rolle.ident + i} rolle={rolle} withBorder={false} stønad18År={rolle.stønad18År} />
                        ))}
                </HStack>
            </Box>
        </Bleed>
    );
}

function SkjermbildeDetaljer({ saksnummer, skjermbilde }: { saksnummer: string; skjermbilde?: ISkjermbildeDetaljer }) {
    return (
        <HStack align="center" gap="space-4">
            <HStack align="center">
                <BodyShort size="small" className="saksnr">
                    Saksnr. {saksnummer}
                </BodyShort>
                <CopyButton size="small" copyText={saksnummer} activeText="Kopierte saksnummer" />
            </HStack>
            {skjermbilde && (
                <>
                    <BodyShort size="small">/</BodyShort>
                    <VStack align="center">
                        <BodyShort size="small">
                            {skjermbilde.navn} {skjermbilde.referanse}
                        </BodyShort>
                        <CopyButton size="small" copyText={skjermbilde.referanse?.toString()} activeText="Kopiert" />
                    </VStack>
                </>
            )}
        </HStack>
    );
}
