import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkHeavyIcon, PersonIcon } from "@navikt/aksel-icons";
import { BodyShort, Heading } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import DiskresjonAlert from "../../../components/DiskresjonAlert";
import PersonInfo from "../../../components/PersonInfo";
import type { BarnMedManglendeForeldreSkjemaData, ForelderPartRolle } from "../../opprett-sak-schema";
import { hentForelderRolleLabel } from "../../utils";
import ForelderRolleVelger from "./ForelderRolleVelger";

type Props = {
    form: UseFormReturn<BarnMedManglendeForeldreSkjemaData>;
    forelder: PersonDto;
    onVelgRolle: (rolle: ForelderPartRolle) => void;
    valgtRolle: ForelderPartRolle | null;
};

export default function KjentForelderInfo({ form, forelder, onVelgRolle, valgtRolle }: Props) {
    const kjentForelder = form.watch("foreldre")[0];
    const kjentForelderRolle = kjentForelder?.rolle;
    const harRolle = kjentForelderRolle !== null && kjentForelderRolle !== undefined;

    return (
        <div className="space-y-4">
            <Heading level="2" size="medium">
                Registrert forelder
            </Heading>

            <div className="p-4 rounded-lg border border-ax-neutral-300 bg-ax-accent-100 space-y-3">
                <div className="flex flex-col mb-4">
                    <div className="flex items-start gap-3">
                        <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-accent-700 mt-1" />
                        <PersonInfo
                            navn={forelder.visningsnavn}
                            ident={forelder.ident}
                            fødselsdato={forelder.fødselsdato ?? undefined}
                        />
                        {forelder.diskresjonskode && <DiskresjonAlert diskresjonskode={forelder.diskresjonskode} />}
                    </div>
                </div>

                <ForelderRolleVelger
                    value={valgtRolle}
                    onChange={onVelgRolle}
                    error={form.formState?.errors?.foreldre?.[0]?.rolle?.message}
                    legend="Velg rolle for denne forelderen"
                />

                {harRolle && (
                    <BodyShort size="small" className="text-ax-success-800 font-semibold flex items-center">
                        <CheckmarkHeavyIcon aria-hidden fontSize="1.3rem" /> Rolle valgt:{" "}
                        {hentForelderRolleLabel(kjentForelderRolle)}
                    </BodyShort>
                )}
            </div>
        </div>
    );
}
