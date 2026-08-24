import { SoktAvType } from "@bidrag/api/BidragBehandlingApiV1";

export const SOKNAD_LABELS = {
    [SoktAvType.BIDRAGSMOTTAKER]: "Bidragsmottaker",
    [SoktAvType.BM_I_ANNEN_SAK]: "Bidragsmottaker i annen sak",
    [SoktAvType.FYLKESNEMDA]: "Fylkesnemda",
    [SoktAvType.NAV_BIDRAG]: "NAV bidrag",
    [SoktAvType.BARN18AR]: "Barn 18 år",
    [SoktAvType.KONVERTERING]: "Konvertering",
    [SoktAvType.NAV_INTERNASJONALT]: "NAV internasjonal",
    [SoktAvType.NORSKE_MYNDIGHET]: "Norske myndigheter",
    [SoktAvType.BIDRAGSPLIKTIG]: "Bidragspliktig",
    [SoktAvType.TRYGDEETATEN_INNKREVING]: "Trygdeetaten innkreving",
    [SoktAvType.UTENLANDSKE_MYNDIGHET]: "Utenlandske myndigheter",
    [SoktAvType.VERGE]: "Verge",
    [SoktAvType.KOMMUNE]: "Kommune",
    [SoktAvType.KLAGE_ANKE]: "Klage og anke",
} as const;
