import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { ForelderBarnRelasjonDto, MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useCallback, useContext, useRef, useState } from "react";

import { hentPersonMotpartBarnRelasjonQueryOptions } from "~/api/useApi.ts";
import type { OpprettSakInngang } from "./inngang";
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
/** Styrer hva som skjer etter innsending og om flyten kan avbrytes. Settes av den som bygger inn flyten. */
export type OpprettSakFlytValg = {
    inngang?: OpprettSakInngang;
    onOpprettet?: (saksnummer: string) => void;
    onAvbryt?: () => void;
};

type SaksrolleroversiktContext = OpprettSakFlytValg & {
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
    | { key: number; type: "BARNEBIDRAG"; barnkurver: MotpartBarnRelasjon[] }
    | { key: number; type: "OPPFOSTRINGSBIDRAG"; barnkurver: MotpartBarnRelasjon[] }
    | { key: number; type: "FARSKAP"; barnkurver: MotpartBarnRelasjon[] }
    | { key: number; type: "EKTEFELLEBIDRAG"; motpart: PersonDto[] | null };

const SaksrolleroversiktContext = createContext<SaksrolleroversiktContext>({} as SaksrolleroversiktContext);

function useValgVersjon() {
    const versjonRef = useRef(0);
    const [valgVersjon, setValgVersjon] = useState(0);

    const nesteVersjon = useCallback(() => {
        versjonRef.current += 1;
        setValgVersjon(versjonRef.current);
        return versjonRef.current;
    }, []);

    return { versjonRef, valgVersjon, nesteVersjon };
}

function useSaksrollevalg() {
    const { versjonRef, valgVersjon, nesteVersjon } = useValgVersjon();
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const valgtPersonRef = useRef<PersonDto | null>(null);
    const [partISaken, setPartISaken] = useState<PartISaken | null>(null);
    const [partISakenAlder, setPartISakenAlder] = useState<number | null>(null);
    const [saksrolleFlyt, setSaksrolleFlyt] = useState<SaksrolleFlyt | null>(null);

    const velgPersonOgNullstillRolle = useCallback(
        (person: PersonDto | null) => {
            nesteVersjon();
            valgtPersonRef.current = person;
            setValgtPerson(person);
            setPartISakenAlder(person ? beregnAlderForPerson(person) : null);
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

    return {
        valgtPerson,
        valgVersjon,
        partISaken,
        partISakenAlder,
        saksrolleFlyt,
        setPartISaken,
        setPartISakenAlder,
        setSaksrolleFlyt,
        velgPersonOgNullstillRolle,
        velgRolle,
        settFlytHvisGjeldende,
    };
}

function useRelasjonsoppslag() {
    const queryClient = useQueryClient();

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

                return (
                    foreldreIdent.length < 2 ||
                    !foreldreIdent.includes(bidragsmottaker) ||
                    !foreldreIdent.includes(bidragspliktig)
                );
            }),
        );

        return resultat.some((erUfullstendig) => erUfullstendig);
    };

    return { hentBarnkurver, harUfullstendigRelasjon };
}

function SaksrolleroversiktProvider({
    children,
    inngang,
    onOpprettet,
    onAvbryt,
}: PropsWithChildren<OpprettSakFlytValg>) {
    const { velgPersonOgNullstillRolle, ...valg } = useSaksrollevalg();
    const { hentBarnkurver, harUfullstendigRelasjon } = useRelasjonsoppslag();
    const [isLoadingOpprettSak, setIsLoadingOpprettSak] = useState<boolean>(false);
    const [sakstype, setSakstype] = useState<Sakstype | null>("BARNEBIDRAG");
    const [sakskategori, setSakskategori] = useState<Sakskategori>("Nasjonal");

    const velgSakstype = useCallback(
        (type: Sakstype) => {
            velgPersonOgNullstillRolle(null);
            setSakstype(type);
            setSakskategori("Nasjonal");
        },
        [velgPersonOgNullstillRolle],
    );

    const velgKategori = useCallback(
        (kategori: Sakskategori) => {
            velgPersonOgNullstillRolle(null);
            setSakskategori(kategori);
        },
        [velgPersonOgNullstillRolle],
    );

    return (
        <SaksrolleroversiktContext
            value={{
                ...valg,
                isLoadingOpprettSak,
                sakstype,
                sakskategori,
                setSakstype,
                setSakskategori,
                setIsLoadingOpprettSak,
                velgPerson: velgPersonOgNullstillRolle,
                velgSakstype,
                velgKategori,
                harUfullstendigRelasjon,
                hentBarnkurver,
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
