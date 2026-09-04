import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import type { RolleType } from "./RolleType.ts";

export interface IOpprettSakPageProps {
    id?: string;
    ident: string;
    navn: string;
    rolle?: RolleType;
    initialSelectedForeldre?: {
        ident: string;
        rolle: RolleType;
    };
    eierfogd: string;
    onSubmit: (saksnummer: string) => void;
    onClose: () => void;
}

interface ISakContext extends IOpprettSakPageProps {
    errorMessage?: string;
    selectedMotpart?: MotpartBarnRelasjon;
    updateMotpart: (newMotpart: MotpartBarnRelasjon | undefined) => void;
    updateErrorMessage: (error: string) => void;
    resetErrorMessage: () => void;
}

// Migrert fra bidrag-ui (apps/sak-ui/src/context/sakContext.tsx). `useStartTracing`
// og `PageWrapper`/`QueryClientWrapper` er droppet siden apps/web allerede har
// global tracing og providers via app/root.tsx.
export const SakContext = createContext<ISakContext | null>(null);

export function SakProvider({ children, ...props }: PropsWithChildren<IOpprettSakPageProps>) {
    const [selectedMotpart, setSelectedMotpart] = useState<MotpartBarnRelasjon | undefined>();
    const [errorMessage, setErrorMessage] = useState<string>("");

    const updateMotpart = (newMotpart: MotpartBarnRelasjon | undefined) => {
        setSelectedMotpart(newMotpart);
    };

    const updateErrorMessage = (newError: string) => {
        setErrorMessage(newError);
    };

    const resetErrorMessage = () => {
        setErrorMessage("");
    };

    return (
        <SakContext.Provider
            value={{ selectedMotpart, updateMotpart, errorMessage, updateErrorMessage, resetErrorMessage, ...props }}
        >
            {children}
        </SakContext.Provider>
    );
}

export function useSakContext(): ISakContext {
    const context = useContext(SakContext);
    if (!context) {
        throw new Error("useSakContext må brukes innenfor en <SakProvider>");
    }
    return context;
}

export default SakProvider;
