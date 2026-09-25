import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { useIsMutating } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { OPPRETT_SAK_MUTATION_KEY } from "~/api/useApi.ts";
import { tilPartISaken } from "../parter/part-utils";
import type { OpprettSakInngang } from "../start/inngang";
import type { PartISaken, PartRolle } from "./opprett-sak-schema";

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

/** Personen og rollen skjemaet fylles ut fra, og hvilken flyt som brukes. */
export type OpprettSakStart = {
    person: PersonDto;
    rolle: PartRolle;
    sakstype: Sakstype;
};

type SaksrolleroversiktContext = OpprettSakFlytValg & {
    startperson: PersonDto;
    partISaken: PartISaken;
    partISakenAlder: number | null;
    sakstype: Sakstype;
    /** Personen flyten ble åpnet for. Kan ikke endres i skjemaet. */
    låstIdent: string | null;
};

const SaksrolleroversiktContext = createContext<SaksrolleroversiktContext>({} as SaksrolleroversiktContext);

function SaksrolleroversiktProvider({
    children,
    start,
    låstIdent = null,
    inngang,
    onOpprettet,
    onAvbryt,
}: PropsWithChildren<OpprettSakFlytValg & { start: OpprettSakStart; låstIdent?: string | null }>) {
    const value = useMemo(
        () => ({
            startperson: start.person,
            partISaken: tilPartISaken(start.person, start.rolle),
            partISakenAlder: beregnAlderForPerson(start.person),
            sakstype: start.sakstype,
            låstIdent,
            inngang,
            onOpprettet,
            onAvbryt,
        }),
        [start, låstIdent, inngang, onOpprettet, onAvbryt],
    );

    return <SaksrolleroversiktContext value={value}>{children}</SaksrolleroversiktContext>;
}

function useSaksrolleroversikt() {
    const context = useContext(SaksrolleroversiktContext);
    if (!context) {
        throw new Error("useSaksroller must be used within a SaksrolleroversiktProvider");
    }
    return context;
}

/** Om en sak sendes inn nå. Valg som nullstiller skjemaet sperres imens. */
export function useErOppretterSak() {
    return useIsMutating({ mutationKey: OPPRETT_SAK_MUTATION_KEY }) > 0;
}

export { SaksrolleroversiktProvider, useSaksrolleroversikt };
