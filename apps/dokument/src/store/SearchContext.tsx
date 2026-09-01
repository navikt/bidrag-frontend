import React, { createContext, type ReactNode, useContext, useEffect } from "react";

import { useHentJournalpost } from "../hooks/useDokumentApi";
import type { Sak } from "../types/sak";

type SearchState = "pending" | "success" | "error" | "idle";
interface SearchContextType {
    searchValue: string;
    searchState: SearchState;
    enkelSak: Sak | undefined;
    setEnkelSak: (saksnummer: Sak) => void;
    setSearchValue: (searchValue: string) => void;
    setSearchState: (searchState: SearchState) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [enkelSak, setEnkelSak] = React.useState<Sak | undefined>(undefined);
    const [searchValue, setSearchValue] = React.useState<string>("");
    const [searchState, setSearchState] = React.useState<SearchState>("idle");
    const journalpost = useHentJournalpost();

    useEffect(() => {
        const gjelderAktor = journalpost.gjelderAktor;
        if (gjelderAktor?.ident) {
            setSearchValue(gjelderAktor.ident);
        }
    }, [journalpost]);
    return (
        <SearchContext.Provider
            value={{
                setSearchValue,
                searchValue,
                setEnkelSak,
                enkelSak,
                setSearchState,
                searchState,
            }}
        >
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
};
