import { Tag } from "@navikt/ds-react";

import { useBidragCommons } from "../../api/BidragCommonsContext";
import { ROLE_FORKORTELSER, ROLE_TAGS, ROLE_TAGS_REVURDERING } from "../../types/roller/RoleTags";
import type { RolleType } from "../../types/roller/RolleType";

const RolleTag = ({
    rolleType,
    className,
    ident,
    stønad18År,
}: {
    rolleType: RolleType;
    className?: string;
    ident?: string;
    stønad18År?: boolean;
}) => {
    const { useHentRevurderingsbarn } = useBidragCommons();

    const renderRolletype = ROLE_FORKORTELSER[rolleType] ?? rolleType;
    // `useHentRevurderingsbarn` er selv en hook (den kaller bl.a. useBehandlingV2/useSuspenseQuery
    // internt), så den må kalles ubetinget på hver render - ikke inni en ternary/if - ellers bryter
    // vi React sine Rules of Hooks, som gir ustabile fibre og kan trigge render-loops.
    const erRevurderingsbarn = useHentRevurderingsbarn?.(ident, stønad18År) ?? false;
    const erRevurdering = Boolean(ident) && erRevurderingsbarn;
    const variant = erRevurdering ? ROLE_TAGS_REVURDERING[rolleType] : ROLE_TAGS[rolleType];

    return (
        <Tag
            title={erRevurdering ? "Revurderingsbarn" : ""}
            variant={variant}
            size="small"
            className={`w-8 mr-2 rounded select-none rolleTag ${rolleType} ${className}`}
        >
            {stønad18År ? `${renderRolletype}¹⁸` : renderRolletype}
        </Tag>
    );
};

export default RolleTag;
