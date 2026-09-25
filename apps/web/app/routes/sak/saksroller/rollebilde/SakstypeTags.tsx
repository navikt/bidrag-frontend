import { HStack, Tag } from "@navikt/ds-react";

interface SakstypeTagsProps {
    sakstype: string;
    sakskategoriVisningsnavn?: string;
    erEgenAnsatt?: boolean;
    erAdressebeskyttet?: boolean;
    erAvsluttet?: boolean;
}

export function SakstypeTags({
    sakstype,
    sakskategoriVisningsnavn,
    erEgenAnsatt,
    erAdressebeskyttet,
    erAvsluttet,
}: SakstypeTagsProps) {
    return (
        <HStack gap="space-8" wrap>
            <Tag size="small" variant="info">
                {sakstype}
            </Tag>
            {sakskategoriVisningsnavn && (
                <Tag size="small" variant="info">
                    {sakskategoriVisningsnavn}
                </Tag>
            )}
            {erEgenAnsatt && (
                <Tag size="small" variant="warning">
                    Egen ansatt
                </Tag>
            )}
            {erAdressebeskyttet && (
                <Tag size="small" variant="warning">
                    Adressebeskyttelse
                </Tag>
            )}
            {erAvsluttet && (
                <Tag size="small" variant="error">
                    Avsluttet sak
                </Tag>
            )}
        </HStack>
    );
}
