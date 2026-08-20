import { CopyButton } from "@navikt/ds-react";
import React from "react";

export const PersonIdent = ({ ident, showCopyButton = false }: { ident: string; showCopyButton: boolean }) => {
    return (
        <>
            <span className="personident">{ident}</span>
            {showCopyButton && <CopyButton copyText={ident} />}
        </>
    );
};
