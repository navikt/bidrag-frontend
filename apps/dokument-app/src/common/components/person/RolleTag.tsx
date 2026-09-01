import React from "react";

import type { Rolletype } from "../../../api/BidragSakApi";

interface RolleTagProps {
    rolleType: Rolletype;
}
export default function RolleTag({ rolleType }: RolleTagProps) {
    return <span className={"select-none rolleTag " + rolleType}>{rolleType}</span>;
}
