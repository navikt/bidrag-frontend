import type { PersonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { type Dispatch, type SetStateAction, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";
import type { ForeslåttForelder } from "./forelder-uten-barn-visningsmodell";
import { slåSammenForeldreforslag, utledForeldreforslag } from "./utled-foreldreforslag";

export function useForeldreForslag({
    barn,
    foreldreinformasjon,
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
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    motpart: ForelderUtenBarnSkjemaData["motpart"];
    motpartErManueltValgt: boolean;
    motsattRolle: ForelderPartRolle;
    onFeil: (melding: string) => void;
    onInfoMelding: (melding: string) => void;
    onMotpartSøk: (ident: string) => void;
    onMotpartValgt: (manueltValgt: boolean) => void;
    onForeslåtteForeldre: Dispatch<SetStateAction<ForeslåttForelder[]>>;
    partISaken: NonNullable<ForelderUtenBarnSkjemaData["partISaken"]>;
}) {
    useEffect(() => {
        if (!barn || !foreldreinformasjon) {
            return;
        }

        const handleForeldreinformasjon = () => {
            try {
                const resultat = utledForeldreforslag({
                    barn,
                    foreldre: foreldreinformasjon,
                    motpart,
                    motpartErManueltValgt,
                    partISaken,
                });

                if (resultat.feil) {
                    onFeil(resultat.feil);
                }
                if (resultat.infoMelding) {
                    onInfoMelding(resultat.infoMelding);
                }

                if (resultat.automatiskMotpart) {
                    form.setValue("motpart", {
                        ident: resultat.automatiskMotpart.ident,
                        navn: resultat.automatiskMotpart.visningsnavn,
                        erKjent: true,
                        rolle: motsattRolle,
                        diskresjonskode: resultat.automatiskMotpart.diskresjonskode,
                    });
                    onMotpartSøk(resultat.automatiskMotpart.ident);
                    onMotpartValgt(false);
                }

                if (resultat.erstattForslag) {
                    onForeslåtteForeldre(resultat.forslag);
                } else {
                    onForeslåtteForeldre((eksisterende) => slåSammenForeldreforslag(eksisterende, resultat.forslag));
                }
            } catch (error) {
                onFeil("Noe gikk galt ved søk");
                void SecureLoggerService.error(
                    "Noe gikk galt ved søk",
                    error instanceof Error ? error : new Error(String(error)),
                );
            }
        };

        handleForeldreinformasjon();
    }, [
        barn,
        foreldreinformasjon,
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
