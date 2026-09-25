import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { useIsMutating } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { OPPRETT_SAK_MUTATION_KEY } from "~/api/useApi.ts";

import type { OpprettSakInngang } from "./inngang";
import type { PartISaken, PartRolle } from "./opprett-sak-schema";
import { tilPartISaken } from "./utils";

export type Sakstype = "BARNEBIDRAG" | "EKTEFELLEBIDRAG" | "OPPFOSTRINGSBIDRAG" | "FARSKAP";
export type Sakskategori = "Nasjonal" | "Utland";
export function sakstypeTilTekst(sakstype: Sakstype) {
    switch (sakstype) {
        case "BARNEBIDRAG":
            return "Barnebidrag";
        case "EKTEFELLEBIDRAG":
            return "Ektefellebidrag";
        case "OPPFOSTRINGSBIDRAG":
            return "Oppfostringsbidrag";
        case "FARSKAP":
            return "Farskap";
    }
}
export function sakstypeTilBeskrivelse(sakstype: Sakstype) {
    switch (sakstype) {
        case "BARNEBIDRAG":
            return "Start med å identifisere en part i saken (forelder eller barn).";
        case "EKTEFELLEBIDRAG":
            return "Søk opp en av ektefellene eller samboerne.";
        case "OPPFOSTRINGSBIDRAG":
            return "Søk opp en av foreldrene.";
        case "FARSKAP":
            return "Søk opp bidragsmottakeren.";
    }
}
const TVUNGEN_ROLLE: Partial<Record<Sakstype, PartRolle>> = {
    OPPFOSTRINGSBIDRAG: "bidragspliktig",
    FARSKAP: "bidragsmottaker",
};

export function tvungenRolle(sakstype: Sakstype | null): PartRolle | null {
    return (sakstype && TVUNGEN_ROLLE[sakstype]) ?? null;
}

/** Styrer hva som skjer etter innsending og om flyten kan avbrytes. Settes av den som bygger inn flyten. */
export type OpprettSakFlytValg = {
    inngang?: OpprettSakInngang;
    onOpprettet?: (saksnummer: string) => void;
    onAvbryt?: () => void;
};

type SaksrolleroversiktContext = OpprettSakFlytValg & {
    valgtPerson: PersonDto | null;
    /** Øker ved hvert nytt valg, slik at underflyten monteres på nytt med tomt skjema. */
    valgVersjon: number;
    partISaken: PartISaken | null;
    partISakenAlder: number | null;
    isLoadingOpprettSak: boolean;
    sakstype: Sakstype | null;
    sakskategori: Sakskategori;
    velgPerson: (person: PersonDto, rolle?: PartRolle | null) => void;
    velgSakstype: (type: Sakstype) => void;
    velgKategori: (kategori: Sakskategori) => void;
    velgRolle: (rolle: PartRolle) => void;
};

const SaksrolleroversiktContext = createContext<SaksrolleroversiktContext>({} as SaksrolleroversiktContext);

function SaksrolleroversiktProvider({
    children,
    inngang,
    onOpprettet,
    onAvbryt,
}: PropsWithChildren<OpprettSakFlytValg>) {
    const [valgVersjon, setValgVersjon] = useState(0);
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const [rolle, setRolle] = useState<PartRolle | null>(null);
    const isLoadingOpprettSak = useIsMutating({ mutationKey: OPPRETT_SAK_MUTATION_KEY }) > 0;
    const [sakstype, setSakstype] = useState<Sakstype | null>("BARNEBIDRAG");
    const [sakskategori, setSakskategori] = useState<Sakskategori>("Nasjonal");

    const nyttValg = useCallback((person: PersonDto | null, nyRolle: PartRolle | null) => {
        setValgVersjon((forrige) => forrige + 1);
        setValgtPerson(person);
        setRolle(nyRolle);
    }, []);

    const velgPerson = useCallback(
        (person: PersonDto, ønsketRolle: PartRolle | null = null) =>
            nyttValg(person, tvungenRolle(sakstype) ?? ønsketRolle),
        [nyttValg, sakstype],
    );

    const velgRolle = useCallback((nyRolle: PartRolle) => nyttValg(valgtPerson, nyRolle), [nyttValg, valgtPerson]);

    const velgSakstype = useCallback(
        (type: Sakstype) => {
            nyttValg(null, null);
            setSakstype(type);
            setSakskategori("Nasjonal");
        },
        [nyttValg],
    );

    const velgKategori = useCallback(
        (kategori: Sakskategori) => {
            nyttValg(null, null);
            setSakskategori(kategori);
        },
        [nyttValg],
    );

    const partISaken = useMemo(
        () => (valgtPerson && rolle ? tilPartISaken(valgtPerson, rolle) : null),
        [valgtPerson, rolle],
    );

    return (
        <SaksrolleroversiktContext
            value={{
                valgtPerson,
                valgVersjon,
                partISaken,
                partISakenAlder: valgtPerson ? beregnAlderForPerson(valgtPerson) : null,
                isLoadingOpprettSak,
                sakstype,
                sakskategori,
                velgPerson,
                velgSakstype,
                velgKategori,
                velgRolle,
                inngang,
                onOpprettet,
                onAvbryt,
            }}
        >
            {children}
        </SaksrolleroversiktContext>
    );
}

function useSaksrolleroversikt() {
    const context = useContext(SaksrolleroversiktContext);
    if (context === undefined) {
        throw new Error("useSaksroller must be used within a SaksrolleroversiktProvider");
    }
    return context;
}

export { SaksrolleroversiktProvider, useSaksrolleroversikt };
