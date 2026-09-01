import { Alert, Heading, Loader } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import React, { type MutableRefObject, type ReactElement, useCallback, useEffect, useRef } from "react";

import useRegisterField from "../../../../common/components/form/hooks/useRegisterField";
import Gjelder from "../../../../common/components/person/Gjelder";
import { useHentJournalpost } from "../../../../hooks/useDokumentApi";
import { hentPerson, PersonApiQueryKeys, useHentGjelder } from "../../../../hooks/usePersonApi";
import { useSearch } from "../../../../store/SearchContext";
import type { Person } from "../../../../types/person";
import type { JournalpostToRegister } from "../types/JournalpostToRegister";
import AvsenderMottakerPanel from "./AvsenderMottakerPanel";
import TilknyttetSaksRoller from "./TilknyttetSaksRoller";

export default function GjelderPersonPanel(): ReactElement {
    const person = useHentGjelder();

    return (
        <div className={"gjelder-person-panel"} id={"gjelderPersonPanel"}>
            <Heading size="medium">Gjelder</Heading>

            <React.Suspense fallback={<Loader title={"Laster person eller sak"} />}>
                <GjelderPersonForm person={person} />
            </React.Suspense>
        </div>
    );
}

function GjelderPersonForm({ person }: { person: Person }) {
    const gjelderPersonPanelRef = useRef<HTMLDivElement>(null);
    const qc = useQueryClient();
    const { error, onUpdate } = useRegisterField<JournalpostToRegister>(
        "gjelderIdent",
        { required: "Du må velge person" },
        () => gjelderPersonPanelRef.current,
    );
    const journalpost = useHentJournalpost();
    const hentPersonCallback = useCallback(async (personId: string) => {
        const person = await hentPerson(personId);
        qc.setQueryData(PersonApiQueryKeys.hentGjelder(journalpost.journalpostId), person);
    }, []);

    function onPersonSelected(ident: string) {
        hentPersonCallback(ident);
    }

    useEffect(() => {
        onUpdate(person?.ident);
    }, [person]);

    return (
        <div>
            <GjelderPersonContent personRef={gjelderPersonPanelRef} onPersonSelected={onPersonSelected} />
            <AvsenderMottakerPanel />
            {error?.message && (
                <Alert variant="error" inline>
                    {error.message}
                </Alert>
            )}
        </div>
    );
}

interface GjelderPersonProps {
    onPersonSelected: (ident: string) => void;
    personRef: MutableRefObject<HTMLDivElement>;
}

function GjelderPersonContent(props: GjelderPersonProps) {
    const { enkelSak, searchState } = useSearch();
    const gjelderPerson = useHentGjelder();
    if (searchState === "pending") {
        return <Loader title={"Laster person eller sak"} />;
    }
    if (!_.isEmpty(enkelSak)) {
        return (
            <div ref={props.personRef}>
                <TilknyttetSaksRoller onPersonSelected={props.onPersonSelected} enkelSak={enkelSak} />
            </div>
        );
    }
    return <Gjelder person={gjelderPerson} />;
}
