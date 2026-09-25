import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils";

const MAKS_ALDER_BARN = 24;
type MotpartBarnRelasjonDto = { personensMotpartBarnRelasjon?: MotpartBarnRelasjon[] };

export function beregnSakForslag({
    motpartRelasjon,
    barnListe,
    barnIdenter,
    ukjentForelder,
    andreForelderIdent,
}: {
    motpartRelasjon: MotpartBarnRelasjonDto;
    barnListe: { fodselsnummer?: string }[];
    barnIdenter: (string | undefined)[];
    ukjentForelder: boolean;
    andreForelderIdent: string | undefined;
}): { muligeAndreForeldre: PersonDto[]; muligeBarnPerMotpart: Map<string, PersonDto[]> } {
    const erBarnUnderMaksAlder = (barn: PersonDto) => {
        const alder = beregnAlderForPerson(barn);
        return alder != null && alder <= MAKS_ALDER_BARN;
    };
    const relasjoner = motpartRelasjon.personensMotpartBarnRelasjon ?? [];
    const barnMap = new Map<string, PersonDto[]>();
    const muligeAndreForeldre: PersonDto[] = [];
    const leggTil = (relasjonerSomSkalLeggesTil: MotpartBarnRelasjon[], filtrerBortBarnISaken: boolean) =>
        relasjonerSomSkalLeggesTil.forEach((rel) => {
            if (rel.motpart) {
                muligeAndreForeldre.push(rel.motpart);
                barnMap.set(
                    rel.motpart.ident,
                    filtrerBortBarnISaken
                        ? rel.fellesBarn.filter((barn) => !barnIdenter.includes(barn.ident))
                        : rel.fellesBarn,
                );
            }
        });

    if (ukjentForelder) {
        leggTil(
            barnListe.length === 0
                ? relasjoner
                : relasjoner.filter((rel) => rel.fellesBarn.some((barn) => barnIdenter.includes(barn.ident))),
            barnListe.length > 0,
        );
    } else if (andreForelderIdent && barnListe.length > 0) {
        const relasjon = relasjoner.find((rel) => rel.motpart?.ident === andreForelderIdent);
        if (relasjon)
            barnMap.set(
                andreForelderIdent,
                relasjon.fellesBarn.filter((barn) => !barnIdenter.includes(barn.ident)),
            );
    }

    const muligeBarnPerMotpart = new Map(
        Array.from(barnMap.entries())
            .map(([ident, barn]): [string, PersonDto[]] => [ident, barn.filter(erBarnUnderMaksAlder)])
            .filter(([, barn]) => barn.length > 0),
    );
    return { muligeAndreForeldre, muligeBarnPerMotpart };
}
