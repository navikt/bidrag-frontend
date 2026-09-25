import { TilgangsFeilError } from "@bidrag/api";
import type { BidragssakDto } from "@bidrag/api/SakApi";

type Grunnlag = {
    partISaken: { ident: string; navn: string; rolle: string };
    motpart: { ident: string; rolle: string; erKjent: boolean | undefined };
    erEktefellebidrag?: boolean;
    skalHente: boolean;
    isLoading: boolean;
    error: unknown;
    sakForPartISaken: BidragssakDto[] | undefined;
};

type Resultat = {
    harEksisterendeSak: boolean;
    eksisterendeSak: BidragssakDto | null;
    infoMelding: { type: "info" | "error" | "warning"; melding: string } | null;
};

export function beregnEksisterendeSakSjekk({
    partISaken,
    motpart,
    erEktefellebidrag,
    skalHente,
    isLoading,
    error,
    sakForPartISaken,
}: Grunnlag): Resultat {
    const ingenTreff = { harEksisterendeSak: false, eksisterendeSak: null, infoMelding: null };
    if (!skalHente) return ingenTreff;
    if (error) {
        return {
            ...ingenTreff,
            infoMelding:
                error instanceof TilgangsFeilError
                    ? { type: "error", melding: error.message }
                    : { type: "warning", melding: "Feil ved henting av eksisterende sak. Kontakt support." },
        };
    }
    if (isLoading) return ingenTreff;
    if (!sakForPartISaken?.length) {
        return {
            ...ingenTreff,
            infoMelding: {
                type: "info",
                melding: `Ingen eksisterende sak funnet for ${partISaken.navn} (${partISaken.ident}). Du kan opprette en ny sak.`,
            },
        };
    }

    const partRolle = partISaken.rolle === "bidragspliktig" ? "BP" : "BM";
    const motpartRolle = motpart.rolle === "bidragspliktig" ? "BP" : "BM";
    if (motpart.erKjent === false) {
        const saker = sakForPartISaken
            .filter(
                (sak) =>
                    sak.roller.some((rolle) => rolle.fodselsnummer === partISaken.ident && rolle.type === partRolle) &&
                    !sak.roller.some((rolle) => rolle.type === motpartRolle),
            )
            .map((sak) => sak.saksnummer);
        if (!saker.length) return ingenTreff;
        const sakstekst = saker.length === 1 ? `sak ${saker[0]}` : `sakene ${saker.join(", ")}`;
        return {
            ...ingenTreff,
            infoMelding: {
                type: "warning",
                melding: `Det finnes allerede ${sakstekst} hvor ${partISaken.navn} er registrert som ${partRolle} uten motpart. Vurder om denne nye saken skal opprettes.`,
            },
        };
    }

    const funnetSak = sakForPartISaken.find((sak) => {
        const harBeggeRoller =
            sak.roller.some((rolle) => rolle.fodselsnummer === partISaken.ident && rolle.type === partRolle) &&
            sak.roller.some((rolle) => rolle.fodselsnummer === motpart.ident && rolle.type === motpartRolle);
        const harBarn = sak.roller.some((rolle) => rolle.type === "BA");
        return harBeggeRoller && (erEktefellebidrag ? !harBarn : harBarn);
    });
    return funnetSak
        ? { harEksisterendeSak: true, eksisterendeSak: funnetSak, infoMelding: null }
        : {
              ...ingenTreff,
              infoMelding: {
                  type: "info",
                  melding: "Ingen sak funnet mellom disse to partene med samme roller. Du kan opprette en ny sak.",
              },
          };
}
