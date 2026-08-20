import { Box, CopyButton, HStack } from "@navikt/ds-react";

import { useBidragCommons } from "../../api/BidragCommonsContext";
import type { IRolleDetaljer, RolleTypeAbbreviation } from "../../types";
import PersonNavnIdent from "../person/PersonNavnIdent";
import RolleTag from "./RolleTag";

interface IRolledetaljerProps {
    label?: string;
    rolle: IRolleDetaljer;
    withBorder?: boolean;
    highlight?: boolean;
}

const RolleCard = ({ rolle }: IRolledetaljerProps) => {
    const { uthevPerson } = useBidragCommons();
    const highlight = uthevPerson?.(rolle.ident, rolle.stønad18År) === true;
    return (
        <Box
            borderWidth="1"
            borderColor="neutral-subtle"
            borderRadius="4"
            paddingInline="space-8"
            paddingBlock="space-6"
            minWidth="220px"
            background={highlight ? undefined : "default"}
            style={
                highlight
                    ? { background: "color-mix(in srgb, var(--ax-bg-accent-moderate) 80%, transparent)" }
                    : undefined
            }
        >
            <HStack gap="space-8" align="center">
                <RolleTag
                    rolleType={rolle.rolleType as unknown as RolleTypeAbbreviation}
                    ident={rolle.ident}
                    stønad18År={rolle.stønad18År}
                />
                <PersonNavnIdent ident={rolle.ident} variant="navnIdent" stønad18År={rolle.stønad18År} />
                <CopyButton size="small" copyText={rolle.ident} />
            </HStack>
        </Box>
    );
};

export default RolleCard;
