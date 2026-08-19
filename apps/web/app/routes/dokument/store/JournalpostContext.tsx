import React, {createContext, ReactNode, useContext} from "react";

import {useHentJournalpost} from "../servicesV2/useDokumentApi";
import {useHentGjelder} from "../servicesV2/usePersonApi";
import {useHentSakerForFødselsnummer} from "../servicesV2/useSakApi";
import {Person} from "../types/person";

type AvvikState = "idle" | "pending" | "success" | "failure" | "success_continue" | "success_lock";

interface JournalpostContextType {
    avsenderMottaker: Person;
    avvikState: AvvikState;
    setAvvikState: (state: AvvikState) => void;
}

const JournalpostContext = createContext<JournalpostContextType | undefined>(undefined);

export const JournalpostProvider = ({children}: { children: ReactNode }) => {
    const journalpost = useHentJournalpost();

    const person = useHentGjelder();
    const [avvikState, setAvvikState] = React.useState<AvvikState>("idle");

    // Init queries
    useHentSakerForFødselsnummer();

    function hentAvsenderMottaker(): Person {
        const avsenderMottakerId = journalpost?.avsenderMottaker?.ident;
        // const avsenderMottaker = await new PersonService().getPerson(avsenderMottakerId);
        // const avsenderMottakerNavnResponse = isEmpty(avsenderMottaker?.navn) ? undefined : avsenderMottaker.navn;
        let avsenderMottakerNavn = journalpost?.avsenderMottaker?.navn ?? journalpost?.avsenderNavn;
        avsenderMottakerNavn = person?.ident === avsenderMottakerId ? person?.visningsnavn : avsenderMottakerNavn;
        return {
            visningsnavn: avsenderMottakerNavn,
            navn: avsenderMottakerNavn,
            ident: avsenderMottakerId,
        };
    }

    return (
        <JournalpostContext.Provider
            value={{
                avvikState,
                setAvvikState,
                avsenderMottaker: hentAvsenderMottaker(),
            }}
        >
            {children}
        </JournalpostContext.Provider>
    );
};

export const useJournalpost = () => {
    const context = useContext(JournalpostContext);
    if (context === undefined) {
        throw new Error("useJournalpost must be used within a JournalpostProvider");
    }
    return context;
};
