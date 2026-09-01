import type { UseFormRegister } from "react-hook-form";

import type { Avvik } from "../../../../../types/avvik";
import { BidragEnhet } from "../../../../../types/enhet";
import { FAGOMRADE } from "../../../../../types/enum/Fagomrade";
import type { Journalpost } from "../../../../../types/journalpost";

export interface AvvikTypeCommonProps {
    activeStep: number;
    setActiveStep: (step: number) => void;
    sendAvvik: (avvik: Avvik, ident?: string) => Promise<void>;
    initialAvvik?: Avvik;
}

export function registerToSelectProps(formName: string, register: UseFormRegister<any>) {
    const { ref, ...otherProps } = register(formName);
    return {
        ...otherProps,
        selectRef: ref,
    };
}

export function erFarskapBehandledeEnhet(enhet: string) {
    return [BidragEnhet.FARSKAP, BidragEnhet.UTLAND, BidragEnhet.EGNE_ANSATTE, BidragEnhet.VIKAFOSSEN].includes(
        enhet as BidragEnhet,
    );
}
export function skalOverføreTilFarskapEnhet(
    eksisterendeEnhetsnummer: string,
    nyFagområde: string,
    journalpost: Journalpost,
) {
    const erInngåendeMottatt = journalpost.isStatusMottatt && journalpost.isInngående;
    return erInngåendeMottatt && nyFagområde == FAGOMRADE.FAR && !erFarskapBehandledeEnhet(eksisterendeEnhetsnummer);
}

export const joarkOverforFagomraderOptions = [
    { label: "Bidrag", value: "BID" },
    { label: "Barnetrygd", value: "BAR" },
    { label: "Farskap", value: "FAR" },
    { label: "Pensjon", value: "PEN" },
    { label: "Enslig forsørger", value: "ENF" },
    { label: "Foreldre- og svangerskapspenger", value: "FOR" },
    { label: "Rettferdsvederlag", value: "RVE" },
    { label: "Oppfølging - Arbeidsgiver", value: "OPA" },
    { label: "Hjelpemidler", value: "HJE" },
    { label: "Kontroll", value: "KTR" },
    { label: "Trekkhåndtering", value: "TRK" },
    { label: "Trygdeavgift", value: "TRY" },
    { label: "Sykepenger", value: "SYK" },
    { label: "Forsikring", value: "FOS" },
    { label: "Medlemskap", value: "MED" },
    { label: "Supplerende stønad", value: "SUP" },
    { label: "Aa-registeret", value: "AAR" },
    { label: "Omsorgspenger, Pleiepenger og opplæringspenger", value: "OMS" },
    { label: "Gravferdsstønad", value: "GRA" },
    { label: "Saksomkostning", value: "SAK" },
    { label: "Serviceklager", value: "SER" },
    { label: "Dagpenger", value: "DAG" },
    { label: "Erstatning", value: "ERS" },
    { label: "Grunn- og hjelpestønad", value: "GRU" },
    { label: "Retting av personopplysninger", value: "RPO" },
    { label: "Yrkesskade / Menerstatning", value: "YRK" },
    { label: "Fullmakt", value: "FUL" },
    { label: "Unntak fra medlemskap", value: "UFM" },
    { label: "Uføretrygd", value: "UFO" },
    { label: "Bil", value: "BIL" },
    { label: "Kontantstøtte", value: "KON" },
    { label: "Arbeidsavklaringspenger", value: "AAP" },
    { label: "Ajourhold - Grunnopplysninger", value: "AGR" },
    { label: "Helsetjenester og ort. hjelpemidler", value: "HEL" },
    { label: "Kompensasjon selvstendig næringsdrivende/frilansere", value: "FRI" },
    { label: "Ventelønn", value: "VEN" },
    // { label: "Generell", value: "GEN" },
];

export const ikkeStottetJoarkOverforFagomrader = [
    { label: "Oppfølging", value: "OPP" },
    { label: "Regnskap/utbetaling", value: "STO" },
    { label: "Sykemeldinger", value: "SYM" },
    { label: "Lønnsgaranti", value: "LGA" },
    { label: "Tilleggsstønad", value: "TSO" },
    { label: "Tilleggsstønad arbeidssøkere", value: "TSR" },
    { label: "Sanksjon - Arbeidsgiver", value: "SAA" },
    { label: "Sikkerhetstiltak", value: "SIK" },
    { label: "Inkluderende Arbeidsliv", value: "IAR" },
    { label: "Tiltakspenger", value: "IND" },
    { label: "Kontakt NAV", value: "KNA" },
    { label: "Sanksjon - Person", value: "SAP" },
    { label: "Yrkesrettet attføring", value: "YRA" },
    { label: "4 - Øvrig", value: "OVR" },
    { label: "1 - Bidrag", value: "BID" },
    { label: "Mob.stønad", value: "MOB" },
    { label: "2 - Bidrag innkreving", value: "BII" },
    { label: "Kommunale tjenester", value: "KOM" },
    { label: "Feilutbetaling", value: "FEI" },
    { label: "Økonomi", value: "OKO" },
    { label: "3 - Skanning", value: "MOT" },
    { label: "Rehabilitering", value: "REH" },
    { label: "Tiltak", value: "TIL" },
    { label: "Rekruttering og Stilling", value: "REK" },
    { label: "Permittering og masseoppsigelser", value: "PER" },
];

export const fagomradeOptions = [
    { label: "Arbeidsavklaringspenger", value: "AAP" },
    { label: "Aa-registeret", value: "AAR" },
    { label: "Ajourhold - Grunnopplysninger", value: "AGR" },
    { label: "Barnetrygd", value: "BAR" },
    { label: "Bidrag", value: "BID" },
    { label: "Bil", value: "BIL" },
    { label: "Dagpenger", value: "DAG" },
    { label: "Enslig forsørger", value: "ENF" },
    { label: "Erstatning", value: "ERS" },
    { label: "Farskap", value: "FAR" },
    { label: "Feilutbetaling", value: "FEI" },
    { label: "Foreldre- og svangerskapspenger", value: "FOR" },
    { label: "Forsikring", value: "FOS" },
    { label: "Fullmakt", value: "FUL" },
    { label: "Generell", value: "GEN" },
    { label: "Gravferdsstønad", value: "GRA" },
    { label: "Grunn- og hjelpestønad", value: "GRU" },
    { label: "Helsetjenester og ortopediske hjelpemidler", value: "HEL" },
    { label: "Hjelpemidler", value: "HJE" },
    { label: "Individstønad", value: "IND" },
    { label: "Inkluderende arbeidsliv", value: "IAR" },
    { label: "Kompensasjon for selvstendig næringsdrivende/frilansere", value: "FRI" },
    { label: "Kontantstøtte", value: "KON" },
    { label: "Kontroll", value: "KTR" },
    { label: "Medlemskap", value: "MED" },
    { label: "Omsorgspenger, pleiepenger og opplæringspenger", value: "OMS" },
    { label: "Oppfølging", value: "OPP" },
    { label: "Oppfølging - Arbeidsgiver", value: "OPA" },
    { label: "Pensjon", value: "PEN" },
    { label: "Permittering og masseoppsigelser", value: "PER" },
    { label: "Regnskap/utbetaling", value: "STO" },
    { label: "Rehabilitering", value: "REH" },
    { label: "Rekruttering og stilling", value: "REK" },
    { label: "Retting av personopplysninger", value: "RPO" },
    { label: "Rettferdsvederlag", value: "RVE" },
    { label: "Saksomkostninger", value: "SAK" },
    { label: "Sanksjon - Person", value: "SAP" },
    { label: "Serviceklager", value: "SER" },
    { label: "Supplerende stønad", value: "SUP" },
    { label: "Sykemeldinger", value: "SYM" },
    { label: "Sykepenger", value: "SYK" },
    { label: "Tilleggsstønad", value: "TSO" },
    { label: "Tilleggsstønad arbeidssøkere", value: "TSR" },
    { label: "Tiltak", value: "TIL" },
    { label: "Trekkhåndtering", value: "TRK" },
    { label: "Trygdeavgift", value: "TRY" },
    { label: "Uføretrygd", value: "UFO" },
    { label: "Ukjent", value: "UKJ" },
    { label: "Unntak fra medlemskap", value: "UFM" },
    { label: "Ventelønn", value: "VEN" },
    { label: "Yrkesrettet attføring", value: "YRA" },
    { label: "Yrkesskade / Menerstatning", value: "YRK" },
];

export function getFagomradeLabel(temaKode: string) {
    return fagomradeOptions.find((f) => f.value === temaKode)?.label ?? "Ukjent";
}
