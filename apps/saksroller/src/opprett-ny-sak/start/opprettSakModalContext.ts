import { createContext, type MouseEventHandler, useContext } from "react";

export type NyOpprettSakFlytProps = {
    ident: string;
    rolle?: "BP" | "BM" | "BA";
    initialForelder?: { ident: string; rolle: "BP" | "BM" };
    eierfogd?: string;
    onOpprettet: (saksnummer: string) => void;
    onAvbryt: () => void;
};

export type ModalSubmit = {
    isLoading: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
};
export const NyOpprettSakModalContext = createContext<{
    formId: string;
    setSubmit: (submit: ModalSubmit | null) => void;
} | null>(null);

export function useNyOpprettSakModal() {
    return useContext(NyOpprettSakModalContext);
}
