import {Box, CopyButton, HStack} from "@navikt/ds-react";

import {useBidragCommons} from "../../api/BidragCommonsContext";
import {IRolleDetaljer} from "../../types/roller/IRolleDetaljer";
import PersonNavnIdent from "../person/PersonNavnIdent";
import RolleTag from "./RolleTag";

interface IRolledetaljerProps {
    label?: string;
    rolle: IRolleDetaljer;
    withBorder?: boolean;
    stønad18År?: boolean;
    highlight?: boolean;
}

const RolleDetaljer = ({rolle, withBorder = true, stønad18År = false}: IRolledetaljerProps) => {
    const {uthevPerson} = useBidragCommons();
    const highlight = uthevPerson?.(rolle.ident, stønad18År) === true;
    return (
        <Box
            paddingInline="space-24"
            paddingBlock="space-4"
            borderWidth={withBorder ? "0 0 1 0" : "0"}
            borderColor="info-strong"
            style={highlight ? {background: "color-mix(in srgb, var(--ax-bg-accent-soft) 30%, transparent)"} : undefined}
        >
            <HStack align="center" gap={"space-4"}>
                <RolleTag rolleType={rolle.rolleType} ident={rolle.ident} stønad18År={stønad18År}/>
                <PersonNavnIdent ident={rolle.ident} variant="compact" stønad18År={stønad18År}/>
                <CopyButton size="small" copyText={rolle.ident}/>
            </HStack>
        </Box>
    );
};
export default RolleDetaljer;
