import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { ForelderBarnRelasjonDto, MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import type { PartISaken } from "./opprett-sak-schema";

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
            return "Søk opp en av foreldrene.";
    }
}
type SaksrolleroversiktContext = {
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
    const [partISaken, setPartISaken] = useState<PartISaken | null>(null);
    const [partISakenAlder, setPartISakenAlder] = useState<number | null>(null);
    const [saksrolleFlyt, setSaksrolleFlyt] = useState<SaksrolleFlyt | null>(null);
    const [isLoadingOpprettSak, setIsLoadingOpprettSak] = useState<boolean>(false);
    const [sakstype, setSakstype] = useState<Sakstype | null>("BARNEBIDRAG");
    const [sakskategori, setSakskategori] = useState<Sakskategori>("Nasjonal");

    const queryClient = useQueryClient();

    const hentBarnkurver = async (ident: string) => {
        return queryClient.fetchQuery({
            queryKey: ["hent_barnkurver", ident],
            queryFn: async () => {
                const { data } = await BIDRAG_PERSON_API.motpartbarnrelasjon.getPersonensMotpartBarnRelasjon({ ident });
                await SecureLoggerService.info(`Hentet barnkurver for ident ${ident}`);
                return data.personensMotpartBarnRelasjon ?? [];
            },
        });
    };

    const hentForelderBarnRelasjon = async (ident: string): Promise<ForelderBarnRelasjonDto> => {
        return queryClient.fetchQuery({
            queryKey: ["hent_forelder_barn_relasjon", ident],
            queryFn: async () => {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident });
                await SecureLoggerService.info(`Hentet forelder-barn relasjon for ident ${ident}`);
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
