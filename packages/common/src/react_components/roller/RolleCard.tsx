import type { RolleDto } from "@bidrag/api/BidragBehandlingApiV1";
import { Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { Box, CopyButton, HStack } from "@navikt/ds-react";

import { useBidragCommons } from "../../api/BidragCommonsContext";
import type { RolleTypeAbbreviation } from "../../types";
import PersonNavnIdent from "../person/PersonNavnIdent";
import RolleTag from "./RolleTag";

interface IRolledetaljerProps {
    label?: string;
    rolle: RolleDto;
    withBorder?: boolean;
    highlight?: boolean;
}

const RolleCard = ({ rolle }: IRolledetaljerProps) => {
    const { uthevPerson } = useBidragCommons();
    const ident = rolle.ident ?? undefined;
    const stønad18År = rolle.stønadstype === Stonadstype.BIDRAG18AAR;
    const highlight = uthevPerson?.(ident, stønad18År) === true;
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
                    rolleType={rolle.rolletype as unknown as RolleTypeAbbreviation}
                    ident={ident}
                    stønad18År={stønad18År}
                />
                <PersonNavnIdent ident={ident} variant="navnIdent" stønad18År={stønad18År} />
                <CopyButton size="small" copyText={ident ?? ""} />
            </HStack>
        </Box>
    );
};

export default RolleCard;
