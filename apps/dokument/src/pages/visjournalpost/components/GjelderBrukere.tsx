import { Heading } from "@navikt/ds-react";
import { useRef } from "react";

import useRegisterField from "../../../common/components/form/hooks/useRegisterField";
import AvsenderMottaker, { AvsenderMottakerChoices } from "../../../common/components/person/AvsenderMottaker";
import Gjelder from "../../../common/components/person/Gjelder";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import { useHentGjelder } from "../../../hooks/usePersonApi";
import { useJournalpost } from "../../../store/JournalpostContext";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "../context/VisJournalpostProvider";

export default function GjelderBrukere() {
    const { isEditMode } = useVisJournalpostContext();
    const journalpost = useHentJournalpost();
    const gjelderPerson = useHentGjelder();
    const { avsenderMottaker } = useJournalpost();
    const ref = useRef<HTMLDivElement>(null);
    const { error, onUpdate, value } = useRegisterField<UpdateJournalpostFormValues>(
        "avsenderNavn",
        { required: journalpost.isNotat ? false : "Avsender kan ikke være tom" },
        () => ref.current,
        {
            enabled: isEditMode,
            initialValue: journalpost.avsenderNavn,
        },
    );
    function getAvsenderMottakerInfo() {
        return {
            navn: avsenderMottaker.visningsnavn,
            foedselsnummer: avsenderMottaker.ident,
            ident: avsenderMottaker?.ident,
        };
    }

    function renderAvsenderMottaker() {
        if (journalpost.isNotat) {
            return null;
        }

        if (journalpost.isUtgaaende || journalpost.isJoarkJournalpost) {
            return (
                <AvsenderMottaker
                    avsenderMottakerInfo={getAvsenderMottakerInfo()}
                    editable={false}
                    isMottaker={journalpost.isUtgaaende}
                />
            );
        }

        return (
            <AvsenderMottaker
                avsenderMottakerInfo={getAvsenderMottakerInfo()}
                gjelder={gjelderPerson}
                containerRef={ref}
                onNameChange={onUpdate}
                editable={isEditMode}
                value={value}
                initialChoice={AvsenderMottakerChoices.FRITEKST}
                error={error?.message}
            />
        );
    }

    return (
        <div className={"grid-panel"} id={"gjelder-brukere-panel"}>
            <Heading size="medium">Gjelder</Heading>
            <Gjelder person={gjelderPerson} />
            {renderAvsenderMottaker()}
        </div>
    );
}
