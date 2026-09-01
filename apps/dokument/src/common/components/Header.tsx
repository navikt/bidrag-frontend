import "./Header.css";

import { Box, Heading } from "@navikt/ds-react";
import React, { type ReactElement } from "react";

import Feilmeldinger from "./feilmelding/Feilmeldinger";

interface HeaderProps {
    journalpostId: string;
    title: string;
}
export default function Header({ journalpostId, title }: HeaderProps): ReactElement {
    function getJournalpostIdWithoutPrefix() {
        if (!journalpostId) {
            return journalpostId;
        }
        return journalpostId.replace("JOARK-", "").replace("BID-", "").replace("BIF-", "");
    }

    return (
        <>
            <Box background="neutral-soft" className="flex flex-row justify-between p-3">
                <Heading size="medium" className="pl-2">
                    {title} #{getJournalpostIdWithoutPrefix()}
                </Heading>
            </Box>
            <Feilmeldinger />
        </>
    );
}
