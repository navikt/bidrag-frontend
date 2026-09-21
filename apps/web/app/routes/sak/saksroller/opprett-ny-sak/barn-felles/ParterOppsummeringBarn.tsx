import type { UseFormReturn } from "react-hook-form";

import type {
    BarnBeggForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaData,
    ForelderPartRolle,
} from "../opprett-sak-schema";
import OppsummeringSection from "../sections/OppsummeringSection";

type ParterOppsummeringBarnProps = {
    form: UseFormReturn<BarnBeggForeldreSkjemaData | BarnMedManglendeForeldreSkjemaData>;
};

export default function ParterOppsummeringBarn({ form }: ParterOppsummeringBarnProps) {
    const barn = form.watch("barn");
    const foreldre = form.watch("foreldre");

    const bidragspliktig = foreldre.find((person) => person.rolle === "bidragspliktig");
    const bidragsmottaker = foreldre.find((person) => person.rolle === "bidragsmottaker");

    return (
        <OppsummeringSection
            bidragspliktig={
                bidragspliktig
                    ? {
                          rolle: "bidragspliktig",
                          ident: bidragspliktig.ident,
                          navn: bidragspliktig.navn,
                          erKjent: bidragspliktig.erKjent,
                          diskresjonskode: bidragspliktig.diskresjonskode,
                      }
                    : null
            }
            bidragsmottaker={
                bidragsmottaker
                    ? {
                          rolle: "bidragsmottaker",
                          ident: bidragsmottaker.ident,
                          navn: bidragsmottaker.navn,
                          erKjent: bidragsmottaker.erKjent,
                          diskresjonskode: bidragsmottaker.diskresjonskode,
                      }
                    : null
            }
            barn={[
                {
                    ident: barn.ident,
                    navn: barn.navn,
                    diskresjonskode: barn.diskresjonskode,
                    reellMottakerType: barn.reellMottakerType,
                    reellMottaker: barn.reellMottaker,
                    reellMottakerNavn: barn.reellMottakerNavn,
                },
            ]}
            partISakenRolle={"bidragspliktig" as ForelderPartRolle}
        />
    );
}
