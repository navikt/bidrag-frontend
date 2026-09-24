import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { ForelderBarnRelasjonDto, MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useCallback, useContext, useRef, useState } from "react";

import { hentPersonMotpartBarnRelasjonQueryOptions } from "~/api/useApi.ts";
import type { PartISaken } from "./opprett-sak-schema";
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
type SaksrolleroversiktContext = {
    valgtPerson: PersonDto | null;
    valgVersjon: number;
    partISaken: PartISaken | null;
    partISakenAlder: number | null;
    saksrolleFlyt: SaksrolleFlyt | null;
    isLoadingOpprettSak: boolean;
    sakstype: Sakstype | null;
    sakskategori: Sakskategori;
    setSakstype: (type: Sakstype | null) => void;
    setSakskategori: (kategori: Sakskategori) => void;
    setIsLoadingOpprettSak: (verdi: boolean) => void;
    setSaksrolleFlyt: (flyt: SaksrolleFlyt | null) => void;
    setPartISaken: (person: PartISaken | null) => void;
    setPartISakenAlder: (alder: number | null) => void;
    velgPerson: (person: PersonDto) => void;
    velgSakstype: (type: Sakstype) => void;
    velgKategori: (kategori: Sakskategori) => void;
    velgRolle: (rolle: PartISaken["rolle"]) => number;
    settFlytHvisGjeldende: (versjon: number, flyt: SaksrolleFlyt) => void;
    harUfullstendigRelasjon: (barn: string[], bidragsmottaker?: string, bidragspliktig?: string) => Promise<boolean>;
    hentBarnkurver: (ident: string) => Promise<MotpartBarnRelasjon[]>;
};

type SaksrolleFlyt =
    | { key: number; type: "FORELDER_MED_BARN"; barnkurver: MotpartBarnRelasjon[] }
    | { key: number; type: "FORELDER_UTEN_BARN" }
    | { key: number; type: "BARN_BEGGE_FORELDRE"; foreldre: PersonDto[] }
    | { key: number; type: "BARN_MANGLENDE_FORELDRE"; forelder: PersonDto | null }
    | { key: number; type: "OPPFOSTRINGSBIDRAG"; barnkurver: MotpartBarnRelasjon[] }
    | { key: number; type: "FARSKAP"; barnkurver: MotpartBarnRelasjon[] }
    | { key: number; type: "EKTEFELLEBIDRAG"; motpart: PersonDto[] | null };

export const SaksrolleroversiktContext = createContext<SaksrolleroversiktContext>({} as SaksrolleroversiktContext);

function SaksrolleroversiktProvider({ children }: PropsWithChildren) {
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const valgtPersonRef = useRef<PersonDto | null>(null);
    const versjonRef = useRef(0);
    const [valgVersjon, setValgVersjon] = useState(0);
    const [partISaken, setPartISaken] = useState<PartISaken | null>(null);
    const [partISakenAlder, setPartISakenAlder] = useState<number | null>(null);
    const [saksrolleFlyt, setSaksrolleFlyt] = useState<SaksrolleFlyt | null>(null);
    const [isLoadingOpprettSak, setIsLoadingOpprettSak] = useState<boolean>(false);
    const [sakstype, setSakstype] = useState<Sakstype | null>("BARNEBIDRAG");
    const [sakskategori, setSakskategori] = useState<Sakskategori>("Nasjonal");

    const queryClient = useQueryClient();

    const nesteVersjon = useCallback(() => {
        versjonRef.current += 1;
        setValgVersjon(versjonRef.current);
        return versjonRef.current;
    }, []);

    const velgPerson = useCallback(
        (person: PersonDto) => {
            nesteVersjon();
            valgtPersonRef.current = person;
            setValgtPerson(person);
            setPartISakenAlder(beregnAlderForPerson(person));
            setPartISaken(null);
            setSaksrolleFlyt(null);
        },
        [nesteVersjon],
    );

    const velgSakstype = useCallback(
        (type: Sakstype) => {
            nesteVersjon();
            valgtPersonRef.current = null;
            setSakstype(type);
            setSakskategori("Nasjonal");
            setValgtPerson(null);
            setPartISakenAlder(null);
            setPartISaken(null);
            setSaksrolleFlyt(null);
        },
        [nesteVersjon],
    );

    const velgKategori = useCallback(
        (kategori: Sakskategori) => {
            nesteVersjon();
            valgtPersonRef.current = null;
            setSakskategori(kategori);
            setValgtPerson(null);
            setPartISakenAlder(null);
            setPartISaken(null);
            setSaksrolleFlyt(null);
        },
        [nesteVersjon],
    );

    const velgRolle = useCallback(
        (rolle: PartISaken["rolle"]) => {
            const person = valgtPersonRef.current;
            if (!person) return versjonRef.current;
            const versjon = nesteVersjon();
            setPartISaken(tilPartISaken(person, rolle));
            setSaksrolleFlyt(null);
            return versjon;
        },
        [nesteVersjon],
    );

    const settFlytHvisGjeldende = useCallback((versjon: number, flyt: SaksrolleFlyt) => {
        if (versjonRef.current === versjon) setSaksrolleFlyt(flyt);
    }, []);

    const hentBarnkurver = async (ident: string) => {
        const data = await queryClient.fetchQuery(hentPersonMotpartBarnRelasjonQueryOptions({ ident }));
        return data?.personensMotpartBarnRelasjon ?? [];
    };

    const hentForelderBarnRelasjon = async (ident: string): Promise<ForelderBarnRelasjonDto> => {
        return queryClient.fetchQuery({
            queryKey: ["hent_forelder_barn_relasjon", ident],
            queryFn: async () => {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident });
                return data;
            },
        });
    };

    const harUfullstendigRelasjon = async (
        barn: string[],
        bidragsmottaker?: string,
        bidragspliktig?: string,
    ): Promise<boolean> => {
        if (!bidragsmottaker || !bidragspliktig) {
            return true;
        }

        const resultat = await Promise.all(
            barn.map(async (barnIdent) => {
                const relasjon = await hentForelderBarnRelasjon(barnIdent);

                const foreldreIdent = relasjon.forelderBarnRelasjon
                    .filter((i) => i.minRolleForPerson === "BARN")
                    .map((i) => i.relatertPersonsIdent);

                if (foreldreIdent.length < 2) {
                    return true;
                }

                const harBidragsmottaker = foreldreIdent.includes(bidragsmottaker);
                const harBidragspliktig = foreldreIdent.includes(bidragspliktig);

                return !harBidragsmottaker || !harBidragspliktig;
            }),
        );

        return resultat.some((erUfullstendig) => erUfullstendig);
    };

    return (
        <SaksrolleroversiktContext
            value={{
                valgtPerson,
                valgVersjon,
                partISaken,
                partISakenAlder,
                saksrolleFlyt,
                isLoadingOpprettSak,
                sakstype,
                sakskategori,
                setSakstype,
                setSakskategori,
                setIsLoadingOpprettSak,
                setSaksrolleFlyt,
                setPartISaken,
                setPartISakenAlder,
                velgPerson,
                velgSakstype,
                velgKategori,
                velgRolle,
                settFlytHvisGjeldende,
                harUfullstendigRelasjon,
                hentBarnkurver,
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
