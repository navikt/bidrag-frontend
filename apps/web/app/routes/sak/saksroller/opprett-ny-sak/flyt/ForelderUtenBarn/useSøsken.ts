import type { PersonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { useEffect, useState } from "react";
import type { BarnMedAlder } from "../../opprett-sak-schema";
import { MAKS_ALDER_BARN, MYNDYG_BARN_ALDER } from "../../opprett-sak-schema";

type MotpartBarnRelasjon = {
    personensMotpartBarnRelasjon: Array<{
        fellesBarn: PersonDto[];
    }>;
};

export function useSøsken({
    motpartBarnRelasjon,
    valgteBarn,
    onMotpartSøkFerdig,
}: {
    motpartBarnRelasjon?: MotpartBarnRelasjon;
    valgteBarn: BarnMedAlder[];
    onMotpartSøkFerdig: () => void;
}) {
    const [søsken, settSøsken] = useState<BarnMedAlder[]>([]);

    useEffect(() => {
        if (!motpartBarnRelasjon || valgteBarn.length === 0) {
            return;
        }

        try {
            const relasjonerMedAlleBarn = motpartBarnRelasjon.personensMotpartBarnRelasjon.filter((relasjon) => {
                const barnIRelasjon = relasjon.fellesBarn.map((barn) => barn.ident);
                return valgteBarn.every((barn) => barnIRelasjon.includes(barn.ident));
            });

            const søskenMedAlder: BarnMedAlder[] = relasjonerMedAlleBarn
                .flatMap((relasjon) => relasjon.fellesBarn)
                .flatMap((barn) => {
                    const alder = beregnAlderForPerson(barn);

                    if (
                        alder === null ||
                        valgteBarn.some((valgtBarn) => valgtBarn.ident === barn.ident) ||
                        alder > MAKS_ALDER_BARN
                    ) {
                        return [];
                    }

                    return [
                        {
                            ident: barn.ident,
                            navn: barn.visningsnavn,
                            fødselsdato: formaterDato(barn.fødselsdato),
                            alder,
                            erMyndig: alder >= MYNDYG_BARN_ALDER,
                        },
                    ];
                });

            settSøsken(søskenMedAlder);
            onMotpartSøkFerdig();
        } catch (error) {
            SecureLoggerService.warn(
                "Feil ved prosessering av søsken:",
                error instanceof Error ? error : new Error(String(error)),
            );
            settSøsken([]);
        }
    }, [motpartBarnRelasjon, onMotpartSøkFerdig, valgteBarn]);

    return { søsken, settSøsken };
}
