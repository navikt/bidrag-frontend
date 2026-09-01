import React, { useState } from "react";

import AvvikshandteringModal from "../../../../common/components/avvik/components/AvvikshandteringModal";
import { RedirectTo } from "../../../../common/utils/RedirectUtils";
import { useHentJournalpost, useLagreJournalpost } from "../../../../hooks/useDokumentApi";
import { useAppContext } from "../../../../store/AppContext";
import { AvvikType } from "../../../../types/api/AvvikTypes";
import { LagreJournalpostRequest } from "../../../../types/api/JournalpostTypes";
import type { Avvik } from "../../../../types/avvik";
import type { Person } from "../../../../types/person";
import type { Sak } from "../../../../types/sak";
import PersonSakNoAccessModal from "./PersonSakNoAccessModal";

interface PersonSakNoAccessWarningProps {
    sak?: Sak;
    person?: Person;
    onCancel: () => void;
}
export default function PersonSakNoAccessWarning(props: PersonSakNoAccessWarningProps) {
    const { sak, person, onCancel } = props;
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const lagreJournalpost = useLagreJournalpost();
    const journalpost = useHentJournalpost();
    const [avvikModalState, setAvvikModalState] = useState<Avvik>();

    const closeAvvikModal = () => {
        onCancel();
        setAvvikModalState(undefined);
    };

    function lagreJournalpostOgLukk() {
        const lagreJournalpostDto = new LagreJournalpostRequest(journalpost.journalpostId);
        lagreJournalpostDto.gjelder = person.ident;
        return lagreJournalpost
            .mutateAsync({
                journalpost: lagreJournalpostDto,
                journalpostId: journalpost.journalpostId,
                enhet: påloggetEnhet,
            })
            .then((success) => success && videresendTilOppgaveListe());
    }

    function videresendTilOppgaveListe() {
        RedirectTo.oppgaveListe();
    }

    function onPersonOrSakNoAccessModalSubmit(lagreJournalpost?: boolean, overforTilEnhet?: string) {
        if (lagreJournalpost) {
            return lagreJournalpostOgLukk();
        }

        if (overforTilEnhet) {
            setAvvikModalState({
                type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                nyttEnhetsnummer: overforTilEnhet,
                gammeltEnhetsnummer: "",
            });
            return;
        }

        videresendTilOppgaveListe();
    }

    return (
        <>
            {avvikModalState ? (
                <AvvikshandteringModal
                    closeModal={closeAvvikModal}
                    paloggetEnhet={påloggetEnhet}
                    initialAvvik={avvikModalState}
                />
            ) : (
                <PersonSakNoAccessModal
                    sak={sak}
                    person={person}
                    onCancel={onCancel}
                    onSubmit={onPersonOrSakNoAccessModalSubmit}
                />
            )}
        </>
    );
}
