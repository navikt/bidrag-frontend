import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { useIsMutating } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { OPPRETT_SAK_MUTATION_KEY } from "../../api/sak.api";
import { tilPartISaken } from "../parter/part-utils";
import type { OpprettSakInngang } from "../start/inngang";
import type { PartISaken, PartRolle } from "./opprett-sak-schema";

export type OpprettSakstype = "BARNEBIDRAG" | "EKTEFELLEBIDRAG" | "OPPFOSTRINGSBIDRAG" | "FARSKAP";
export type Sakskategori = "Nasjonal" | "Utland";
export function sakstypeTilTekst(sakstype: OpprettSakstype) {
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
export function sakstypeTilBeskrivelse(sakstype: OpprettSakstype) {
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
const TVUNGEN_ROLLE: Partial<Record<OpprettSakstype, PartRolle>> = {
    OPPFOSTRINGSBIDRAG: "bidragspliktig",
    FARSKAP: "bidragsmottaker",
};

export function tvungenRolle(sakstype: OpprettSakstype | null): PartRolle | null {
    return sakstype ? (TVUNGEN_ROLLE[sakstype] ?? null) : null;
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
    sakstype: OpprettSakstype;
};

type OpprettSakStartContext = OpprettSakFlytValg & {
    startperson: PersonDto;
    partISaken: PartISaken;
    partISakenAlder: number | null;
    sakstype: OpprettSakstype;
    /** Personen flyten ble åpnet for. Kan ikke endres i skjemaet. */
    låstIdent: string | null;
};

const OpprettSakStartContext = createContext<OpprettSakStartContext>({} as OpprettSakStartContext);

function OpprettSakStartProvider({
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

    return <OpprettSakStartContext value={value}>{children}</OpprettSakStartContext>;
}

function useOpprettSakStart() {
    const context = useContext(OpprettSakStartContext);
    if (!context) {
        throw new Error("useOpprettSakStart må brukes innenfor OpprettSakStartProvider");
    }
    return context;
}

/** Om en sak sendes inn nå. Valg som nullstiller skjemaet sperres imens. */
export function useErOppretterSak() {
    return useIsMutating({ mutationKey: OPPRETT_SAK_MUTATION_KEY }) > 0;
}

export { OpprettSakStartProvider, useOpprettSakStart };
