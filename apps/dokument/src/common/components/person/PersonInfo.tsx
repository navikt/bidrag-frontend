import "./PersonInfo.css";

import type { Rolletype } from "@bidrag/api/SakApi";
import { PersonNavnIdent } from "@bidrag/common";
import { BodyShort } from "@navikt/ds-react";
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
