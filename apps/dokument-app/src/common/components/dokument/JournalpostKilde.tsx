import { Link } from "@navikt/ds-react";
import React, { useState } from "react";

import { Kanal } from "../../../api/BidragDokumentApi";
import AdresseViewModal from "../../../pages/visjournalpost/components/AdresseViewModal";
import type { Journalpost } from "../../../types/journalpost";
import { isEmpty } from "../../utils/ObjectUtils";
import SimpleTextField from "../fields/SimpleTextField";

interface JournalpostKildeProps {
    journalpost: Journalpost;
}

export default function JournalpostKilde({ journalpost }: JournalpostKildeProps) {
    const [adresseModalOpen, setAdresseModalOpen] = useState<boolean>(false);
    if (isEmpty(journalpost.kildeDisplayValue)) {
        return null;
    }

    function getKilde() {
        if (
            journalpost.isUtgaaende &&
            journalpost.distribuertTilAdresse &&
            journalpost.kilde === Kanal.SENTRAL_UTSKRIFT
        ) {
            return (
                <Link href="#" onClick={() => setAdresseModalOpen(true)}>
                    {journalpost.kildeDisplayValue}
                </Link>
            );
        }
        return journalpost.kildeDisplayValue;
    }
    return (
        <div className={"journalpost-kilde"}>
            <SimpleTextField label={"Kanal"} value={getKilde()} />
            {adresseModalOpen && (
                <AdresseViewModal
                    onCancel={() => setAdresseModalOpen(false)}
                    adresse={journalpost.distribuertTilAdresse}
                />
            )}
        </div>
    );
}
