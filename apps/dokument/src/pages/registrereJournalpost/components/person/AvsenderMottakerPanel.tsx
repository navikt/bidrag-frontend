import { useEffect, useMemo, useRef } from "react";

import useRegisterField from "../../../../common/components/form/hooks/useRegisterField";
import AvsenderMottaker, { AvsenderMottakerChoices } from "../../../../common/components/person/AvsenderMottaker";
import { isEmpty } from "../../../../common/utils/ObjectUtils";
import { useHentJournalpost } from "../../../../hooks/useDokumentApi";
import { useHentGjelder } from "../../../../hooks/usePersonApi";
import { useJournalpost } from "../../../../store/JournalpostContext";
import { useSearch } from "../../../../store/SearchContext";
import { DokumentType } from "../../../../types/api/JournalpostTypes";
import type { JournalpostToRegister } from "../types/JournalpostToRegister";

export default function AvsenderMottakerPanel() {
    const journalpost = useHentJournalpost();
    const enkelSak = useSearch().enkelSak;
    const gjelderPerson = useHentGjelder();
    const { avsenderMottaker } = useJournalpost();
    const avsenderContainerRef = useRef<HTMLDivElement>(null);
    const label = journalpost.dokumentType === DokumentType.U ? "mottaker" : "avsender";
    const isAvsenderEditable = useMemo(
        () => !(journalpost.isJoarkJournalpost && journalpost.isDigitalInnsendt && avsenderMottaker?.navn),
        [journalpost],
    );
    const { error, onUpdate, value } = useRegisterField<JournalpostToRegister>(
        "avsenderNavn",
        { required: `Du må sette ${label} navn` },
        () => avsenderContainerRef.current,
        { enabled: isAvsenderEditable },
    );
    const personName = gjelderPerson.visningsnavn;

    useEffect(() => {
        updateFormValue(isAvsenderEditable ? personName : avsenderMottaker?.navn);
    }, [personName]);

    function updateFormValue(value?: string) {
        onUpdate(value);
    }
    function getAvsenderMottakerInfo() {
        if (isAvsenderEditable) {
            return {
                navn: avsenderMottaker?.navn,
                foedselsnummer: avsenderMottaker?.ident,
                ident: avsenderMottaker?.ident,
                rolleType: getGjelderPersonRolle(),
            };
        }

        return {
            navn: avsenderMottaker?.navn,
            foedselsnummer: avsenderMottaker?.ident,
            ident: avsenderMottaker?.ident,
        };
    }

    function getGjelder() {
        return {
            navn: gjelderPerson.visningsnavn,
            visningsnavn: gjelderPerson.visningsnavn,
            ident: gjelderPerson.ident,
            foedselsnummer: gjelderPerson.ident,
            rolleType: getGjelderPersonRolle(),
        };
    }

    function getGjelderPersonRolle() {
        if (enkelSak) {
            return enkelSak.roller.find((rolle) => rolle.foedselsnummer === gjelderPerson.ident)?.rolleType;
        }
    }

    if (isAvsenderEditable && (!gjelderPerson || isEmpty(gjelderPerson.ident) || isEmpty(gjelderPerson.visningsnavn))) {
        return null;
    }

    return (
        <AvsenderMottaker
            editable={isAvsenderEditable}
            initialChoice={AvsenderMottakerChoices.SAMME_SOM_GJELDER}
            isMottaker={journalpost.dokumentType === DokumentType.U}
            avsenderMottakerInfo={getAvsenderMottakerInfo()}
            gjelder={getGjelder()}
            onNameChange={updateFormValue}
            error={error?.message}
            value={value}
            containerRef={avsenderContainerRef}
        />
    );
}
