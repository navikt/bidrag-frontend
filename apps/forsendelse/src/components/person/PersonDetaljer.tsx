import "./PersonDetaljer.css";

import { RolleTag, type RolleType } from "@bidrag/common";
import { BodyShort, CopyButton } from "@navikt/ds-react";

interface IPersonDetaljerProps {
    rolle?: RolleType;
    navn: string;
    ident?: string;
    copy?: boolean;
    className?: string;
    spacing?: boolean;
}
export default function PersonDetaljer({
    rolle,
    navn,
    ident,
    className,
    copy = true,
    spacing = true,
}: IPersonDetaljerProps) {
    return (
        <div className={`person-detaljer ${spacing ? "margin--M pt-2 pb-2" : ""} ${className} `}>
            {rolle && <RolleTag rolleType={rolle} />}
            <BodyShort size={"medium"}>{navn}</BodyShort>
            {ident && (
                <>
                    <BodyShort size={"medium"}>{(navn ? " / " : "") + ident}</BodyShort>
                    {copy && <CopyButton size="small" copyText={ident} />}
                </>
            )}
        </div>
    );
}
