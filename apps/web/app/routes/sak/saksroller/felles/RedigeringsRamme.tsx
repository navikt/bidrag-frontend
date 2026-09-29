import { createContext, type ReactNode, useContext } from "react";
import PersonSøkModal from "./person-søk/PersonSøkModal.tsx";
import PersonSøkWrapper, { type PersonSøkRammeProps } from "./person-søk/PersonSøkWrapper.tsx";

const ErInlineContext = createContext(false);

/** Viser søk og redigering inline, for eksempel når hele skjemaet selv ligger i en modal. */
export function RedigeringsvisningProvider({ children }: { children: ReactNode }) {
    return <ErInlineContext value>{children}</ErInlineContext>;
}

/** Ramme for søk og redigering. Modal som standard, inline under `RedigeringsvisningProvider`. */
export default function RedigeringsRamme(props: PersonSøkRammeProps) {
    return useContext(ErInlineContext) ? <PersonSøkWrapper {...props} /> : <PersonSøkModal {...props} />;
}
