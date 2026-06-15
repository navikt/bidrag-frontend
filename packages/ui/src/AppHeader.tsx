import { InternalHeader } from "@navikt/ds-react";

interface AppHeaderProps {
    brukerNavn?: string;
    onLoggUt?: () => void;
}

export function AppHeader({ brukerNavn, onLoggUt }: AppHeaderProps) {
    return (
        <InternalHeader>
            <InternalHeader.Title href="/">Bidrag</InternalHeader.Title>
            {brukerNavn && <InternalHeader.User name={brukerNavn} description="Saksbehandler" />}
            {onLoggUt && <InternalHeader.Button onClick={onLoggUt}>Logg ut</InternalHeader.Button>}
        </InternalHeader>
    );
}
