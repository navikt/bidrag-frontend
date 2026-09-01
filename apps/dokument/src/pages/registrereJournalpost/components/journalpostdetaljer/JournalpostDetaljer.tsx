import { BodyShort, Heading } from "@navikt/ds-react";
import type { ReactElement } from "react";

import JournalpostKilde from "../../../../common/components/dokument/JournalpostKilde";
import JournalpostTema from "../../../../common/components/dokument/JournalpostTema";
import { useHentJournalpost } from "../../../../hooks/useDokumentApi";
import MottatDato from "./MottatDato";
import RedigerDokumentInput from "./RedigerDokumentInput";

export default function JournalpostDetaljer(): ReactElement {
    const journalpost = useHentJournalpost();
    const dokumenter = journalpost.dokumenter ?? [];

    return (
        <div className="journalpost-detaljer">
            <Heading size="medium">Dokument(er)</Heading>
            <BodyShort as="div" size="small" className={"journalpost-detaljer-content"}>
                <JournalpostKilde journalpost={journalpost} />
                <JournalpostTema journalpost={journalpost} />
                <MottatDato />
                <div>
                    {dokumenter.map((dokument, index) => (
                        <RedigerDokumentInput
                            index={index}
                            key={dokument.dokumentreferanse}
                            label={`${index === 0 ? "Hoveddokument" : "Vedlegg"} (${dokument.dokumentreferanse})`}
                            dokument={dokument}
                            journalpostId={journalpost.journalpostId}
                        />
                    ))}
                </div>
            </BodyShort>
        </div>
    );
}
