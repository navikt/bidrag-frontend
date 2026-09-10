import { CopyButton } from "@navikt/ds-react";

const PersonIdent = ({
    ident,
    showCopyButton = false,
    ignoreClickOnIdent = false,
}: {
    ident: string;
    showCopyButton?: boolean;
    ignoreClickOnIdent?: boolean;
}) => {
    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: To stop click event from propagating to parent elements.
        <div
            className={`flex flex-row gap-1 items-center`}
            onClick={(e) => {
                if (ignoreClickOnIdent) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    if (ignoreClickOnIdent) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }}
        >
            <span className="personident">{ident}</span>
            {showCopyButton && <CopyButton copyText={ident} size="small" style={{ zIndex: 10000 }} />}
        </div>
    );
};

export default PersonIdent;
