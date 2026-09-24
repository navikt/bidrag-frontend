import type { PersonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";

type ForeslåttForelder = {
    barnIdent: string;
    barnNavn: string;
} & PersonDto;

export function useForeldreForslag({
    barn,
    foreldreinformasjon,
    foreslåttMotpart,
    form,
    motpart,
    motpartErManueltValgt,
    motsattRolle,
    onFeil,
    onInfoMelding,
    onMotpartSøk,
    onMotpartValgt,
    onForeslåtteForeldre,
    partISaken,
}: {
    barn?: PersonDto | null;
    foreldreinformasjon?: PersonDto[];
    foreslåttMotpart: ForeslåttForelder[];
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    motpart: ForelderUtenBarnSkjemaData["motpart"];
    motpartErManueltValgt: boolean;
    motsattRolle: ForelderPartRolle;
    onFeil: (melding: string) => void;
    onInfoMelding: (melding: string) => void;
    onMotpartSøk: (ident: string) => void;
    onMotpartValgt: (manueltValgt: boolean) => void;
    onForeslåtteForeldre: (foreldre: ForeslåttForelder[]) => void;
    partISaken: NonNullable<ForelderUtenBarnSkjemaData["partISaken"]>;
}) {
    useEffect(() => {
        if (!barn || !foreldreinformasjon) {
            return;
        }

        const handleForeldreinformasjon = async () => {
            try {
                const foreldre = foreldreinformasjon;
                if (foreldre.length > 2) {
                    onFeil(
                        `Dette barnet (${barn.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`,
                    );
                } else if (foreldre.length === 2 && !foreldre.some((forelder) => forelder.ident === partISaken.ident)) {
                    onFeil(
                        `Er du sikker på at dette er riktig barn? Dette barnet (${barn.ident}) har begge foreldre registrert, men ${partISaken.navn} (${partISaken.ident}) har ingen barn registrert.`,
                    );
                }

                const foreslåtteForeldre = foreldre
                    .filter((forelder) => forelder.ident !== partISaken.ident)
                    .map((forelder) => ({
                        ...forelder,
                        barnIdent: barn.ident,
                        barnNavn: barn.visningsnavn,
                    }));
                const enesteMuligeMotpart = foreslåtteForeldre.length === 1 ? foreslåtteForeldre[0] : undefined;

                if (motpartErManueltValgt && enesteMuligeMotpart && enesteMuligeMotpart.ident !== motpart?.ident) {
                    onInfoMelding(
                        `Merk: Dette barnet (${barn.ident}) har ${enesteMuligeMotpart.visningsnavn} som forelder, men du har allerede valgt ${motpart.navn} som motpart. Motparten endres ikke.`,
                    );
                }

                if (enesteMuligeMotpart && !motpart?.ident) {
                    form.setValue("motpart", {
                        ident: enesteMuligeMotpart.ident,
                        navn: enesteMuligeMotpart.visningsnavn,
                        erKjent: true,
                        rolle: motsattRolle,
                        diskresjonskode: enesteMuligeMotpart.diskresjonskode,
                    });
                    onMotpartSøk(enesteMuligeMotpart.ident);
                    onMotpartValgt(false);
                    onForeslåtteForeldre([]);
                } else if (foreslåtteForeldre.length > 0) {
                    onForeslåtteForeldre([
                        ...foreslåttMotpart,
                        ...foreslåtteForeldre.filter(
                            (forelder) => !foreslåttMotpart.some((forslag) => forslag.ident === forelder.ident),
                        ),
                    ]);
                } else {
                    onForeslåtteForeldre([]);
                }
            } catch (error) {
                onFeil("Noe gikk galt ved søk");
                await SecureLoggerService.error(
                    "Noe gikk galt ved søk",
                    error instanceof Error ? error : new Error(String(error)),
                );
            }
        };

        handleForeldreinformasjon();
    }, [
        barn,
        foreldreinformasjon,
        foreslåttMotpart,
        form,
        motpart,
        motpartErManueltValgt,
        motsattRolle,
        onFeil,
        onForeslåtteForeldre,
        onInfoMelding,
        onMotpartSøk,
        onMotpartValgt,
        partISaken,
    ]);
}
