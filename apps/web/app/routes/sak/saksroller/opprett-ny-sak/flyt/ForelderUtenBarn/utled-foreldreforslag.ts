import type { PersonDto } from "@bidrag/api/PersonApi";
import type { ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";
import type { ForeslåttForelder } from "./forelder-uten-barn-visningsmodell";

type PartISaken = NonNullable<ForelderUtenBarnSkjemaData["partISaken"]>;
type Motpart = ForelderUtenBarnSkjemaData["motpart"];

export type ForeldreforslagResultat = {
    feil?: string;
    infoMelding?: string;
    automatiskMotpart?: ForeslåttForelder;
    forslag: ForeslåttForelder[];
    erstattForslag: boolean;
};

export function utledForeldreforslag({
    barn,
    foreldre,
    motpart,
    motpartErManueltValgt,
    partISaken,
}: {
    barn: PersonDto;
    foreldre: PersonDto[];
    motpart: Motpart;
    motpartErManueltValgt: boolean;
    partISaken: PartISaken;
}): ForeldreforslagResultat {
    const forslag = foreldre
        .filter((forelder) => forelder.ident !== partISaken.ident)
        .map((forelder) => ({
            ...forelder,
            barnIdent: barn.ident,
            barnNavn: barn.visningsnavn,
        }));
    const enesteMuligeMotpart = forslag.length === 1 ? forslag[0] : undefined;

    const feil =
        foreldre.length > 2
            ? `Dette barnet (${barn.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`
            : foreldre.length === 2 && !foreldre.some((forelder) => forelder.ident === partISaken.ident)
              ? `Er du sikker på at dette er riktig barn? Dette barnet (${barn.ident}) har begge foreldre registrert, men ${partISaken.navn} (${partISaken.ident}) har ingen barn registrert.`
              : undefined;

    const infoMelding =
        motpartErManueltValgt && enesteMuligeMotpart && enesteMuligeMotpart.ident !== motpart.ident
            ? `Merk: Dette barnet (${barn.ident}) har ${enesteMuligeMotpart.visningsnavn} som forelder, men du har allerede valgt ${motpart.navn} som motpart. Motparten endres ikke.`
            : undefined;
    const automatiskMotpart = enesteMuligeMotpart && !motpart.ident ? enesteMuligeMotpart : undefined;

    return {
        feil,
        infoMelding,
        automatiskMotpart,
        forslag: automatiskMotpart ? [] : forslag,
        erstattForslag: forslag.length === 0 || automatiskMotpart !== undefined,
    };
}

export function slåSammenForeldreforslag(
    eksisterende: ForeslåttForelder[],
    nyeForslag: ForeslåttForelder[],
): ForeslåttForelder[] {
    return [
        ...eksisterende,
        ...nyeForslag.filter(
            (forslag) => !eksisterende.some((eksisterendeForslag) => eksisterendeForslag.ident === forslag.ident),
        ),
    ];
}
