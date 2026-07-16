import type { AktorDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { PersonNavnIdent } from "@bidrag/common";
import { HStack } from "@navikt/ds-react";

interface Props {
    gjelderAktor?: AktorDto | null;
    sakRoller: RolleDto[];
}

export default function PersonIdentMedRolle({
    gjelderAktor,
    sakRoller,
}: Props) {
    if (!gjelderAktor) return null;
    const rolle = sakRoller.find((r) => r.fodselsnummer === gjelderAktor.ident);

    return (
        <HStack gap="space-2" align="center" wrap={false}>
            {rolle?.type}
            <PersonNavnIdent variant="ident" ident={gjelderAktor.ident} />
        </HStack>
    );
}
