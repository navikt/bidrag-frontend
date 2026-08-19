import "./PersonInfo.less";

import { PersonNavnIdent } from "@navikt/bidrag-ui-common";
import { BodyShort } from "@navikt/ds-react";
import React from "react";

import type { Rolletype } from "../../../api/BidragSakApi";
import AccountCircle from "../icons/AccountCircle";

interface PersonInfoProps {
    rolleType?: Rolletype;
    navn?: string;
    ident?: string;
    className?: string;
}
export default function PersonInfo({ className, ...props }: PersonInfoProps) {
    return (
        <BodyShort spacing size="small" className={`!m-[16px] person-info margin--M ${className}`}>
            <AccountCircle />
            <PersonNavnIdent {...props} showCopyButton />
        </BodyShort>
    );
}
