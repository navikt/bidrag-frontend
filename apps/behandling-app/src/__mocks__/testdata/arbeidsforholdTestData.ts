import { IdentUtils } from "@bidrag/common";

import type { Periode } from "./inntektTestData";

export interface ArbeidsforholdData {
    periode: Periode;
    arbeidsgiverNavn: string;
    stillingsprosent: number;
    sisteLoennsendring: string;
}

export const arbeidsforholdData = {
    arbeidsforholdListe: [
        {
            partPersonId: IdentUtils.generateFnr(),
            startdato: "2023-12-14",
            sluttdato: "2023-12-14",
            arbeidsgiverNavn: "string",
            arbeidsgiverOrgnummer: "string",
            ansettelsesdetaljer: [
                {
                    periodeFra: {
                        year: 0,
                        month: "JANUARY",
                        monthValue: 0,
                        leapYear: true,
                    },
                    periodeTil: {
                        year: 0,
                        month: "JANUARY",
                        monthValue: 0,
                        leapYear: true,
                    },
                    arbeidsforholdType: "string",
                    arbeidstidsordningBeskrivelse: "string",
                    ansettelsesformBeskrivelse: "string",
                    yrkeBeskrivelse: "string",
                    antallTimerPrUke: 0,
                    avtaltStillingsprosent: 0,
                    sisteStillingsprosentendringDato: "2023-12-14",
                    sisteLønnsendringDato: "2023-12-14",
                },
            ],
            permisjoner: [
                {
                    startdato: "2023-12-14",
                    sluttdato: "2023-12-14",
                    id: "string",
                    type: {
                        beskrivelse: "string",
                        kode: "string",
                    },
                    prosent: 0,
                    varsling: {
                        beskrivelse: "string",
                        kode: "string",
                    },
                    idHistorikk: [
                        {
                            id: "string",
                            fom: "2023-12-14",
                            tom: "2023-12-14",
                        },
                    ],
                    sporingsinformasjon: {
                        opprettetTidspunkt: "2023-12-14T13:24:52.695Z",
                        opprettetAv: "string",
                        opprettetKilde: "string",
                        opprettetKildereferanse: "string",
                        endretTidspunkt: "2023-12-14T13:24:52.695Z",
                        endretAv: "string",
                        endretKilde: "string",
                        endretKildereferanse: "string",
                    },
                },
            ],
            permitteringer: [
                {
                    startdato: "2023-12-14",
                    sluttdato: "2023-12-14",
                    id: "string",
                    type: {
                        beskrivelse: "string",
                        kode: "string",
                    },
                    prosent: 0,
                    varsling: {
                        beskrivelse: "string",
                        kode: "string",
                    },
                    idHistorikk: [
                        {
                            id: "string",
                            fom: "2023-12-14",
                            tom: "2023-12-14",
                        },
                    ],
                    sporingsinformasjon: {
                        opprettetTidspunkt: "2023-12-14T13:24:52.695Z",
                        opprettetAv: "string",
                        opprettetKilde: "string",
                        opprettetKildereferanse: "string",
                        endretTidspunkt: "2023-12-14T13:24:52.695Z",
                        endretAv: "string",
                        endretKilde: "string",
                        endretKildereferanse: "string",
                    },
                },
            ],
            hentetTidspunkt: "2023-12-14T13:24:52.695Z",
        },
    ],
};
