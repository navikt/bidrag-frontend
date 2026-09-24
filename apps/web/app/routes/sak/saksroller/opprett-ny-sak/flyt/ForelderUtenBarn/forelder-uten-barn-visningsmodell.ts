import type { PersonDto } from "@bidrag/api/PersonApi";
import type { ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";
import { hentMotsattRolle } from "../../utils";

type PartISaken = NonNullable<ForelderUtenBarnSkjemaData["partISaken"]>;
type Motpart = ForelderUtenBarnSkjemaData["motpart"];

export function utledForelderUtenBarnParter(partISaken: PartISaken, motpart: Motpart) {
    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);
    const erBidragspliktig = partISaken.rolle === "bidragspliktig";
    const erBidragsmottaker = partISaken.rolle === "bidragsmottaker";
    const bidragsmottaker = erBidragsmottaker ? partISaken : motpart;

    return {
        motsattRolle,
        erBidragspliktig,
        erBidragsmottaker,
        bidragsmottaker,
        bidragspliktig: erBidragspliktig ? partISaken : motpart,
        bidragsmottakerErUkjent: bidragsmottaker?.erKjent === false,
        normalisertMotpart: {
            ident: motpart.ident ?? "",
            navn: motpart.navn ?? "",
            rolle: motpart.rolle ?? motsattRolle,
            erKjent: motpart.erKjent,
        },
    };
}

export function utledForelderUtenBarnStatus({
    antallValgteBarn,
    erBidragsmottaker,
    bidragsmottakerErUkjent,
    sjekkerTilgangUtenBm,
    kanOppretteSakUtenBm,
    harEksisterendeSak,
    lasterEksisterendeSak,
    lasterEnhet,
}: {
    antallValgteBarn: number;
    erBidragsmottaker: boolean;
    bidragsmottakerErUkjent: boolean;
    sjekkerTilgangUtenBm: boolean;
    kanOppretteSakUtenBm?: boolean;
    harEksisterendeSak: boolean;
    lasterEksisterendeSak: boolean;
    lasterEnhet: boolean;
}) {
    const kanIkkeOppretteSakUtenBm = bidragsmottakerErUkjent && !sjekkerTilgangUtenBm && kanOppretteSakUtenBm === false;

    return {
        kanIkkeOppretteSakUtenBm,
        visUfullstendigRelasjon: antallValgteBarn > 0,
        visBidragsmottakerUtenBarn: erBidragsmottaker && antallValgteBarn === 0,
        submitBlokkert:
            harEksisterendeSak ||
            lasterEksisterendeSak ||
            lasterEnhet ||
            (bidragsmottakerErUkjent && (sjekkerTilgangUtenBm || kanOppretteSakUtenBm !== true)),
    };
}

export type ForeslåttForelder = {
    barnIdent: string;
    barnNavn: string;
} & PersonDto;
