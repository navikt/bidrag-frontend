import { createContext, type ReactNode, useContext } from "react";
import PersonSøkModal from "./person-søk/PersonSøkModal.tsx";
import PersonSøkWrapper, { type PersonSøkRammeProps } from "./person-søk/PersonSøkWrapper.tsx";

type Redigeringsvisning = "modal" | "inline";

const RedigeringsvisningContext = createContext<Redigeringsvisning>("modal");

/** Velger om søk og redigering vises inline, for eksempel når hele skjemaet selv ligger i en modal. */
export function RedigeringsvisningProvider({
    visning,
    children,
}: {
    visning: Redigeringsvisning;
    children: ReactNode;
}) {
    return <RedigeringsvisningContext.Provider value={visning}>{children}</RedigeringsvisningContext.Provider>;
}

/** Ramme for søk og redigering. Modal som standard, inline under `RedigeringsvisningProvider visning="inline"`. */
export default function RedigeringsRamme(props: PersonSøkRammeProps) {
    const visning = useContext(RedigeringsvisningContext);
    return visning === "inline" ? <PersonSøkWrapper {...props} /> : <PersonSøkModal {...props} />;
}
