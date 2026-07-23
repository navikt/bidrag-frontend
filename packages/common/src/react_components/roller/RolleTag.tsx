import { Tag } from "@navikt/ds-react";

import { useBidragCommons } from "../../api/BidragCommonsContext";
import { type RolleType, ROLE_FORKORTELSER, ROLE_TAGS, ROLE_TAGS_REVURDERING } from "../../types";

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
    const erRevurdering = useHentRevurderingsbarn && ident ? useHentRevurderingsbarn(ident, stønad18År) : false;
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
