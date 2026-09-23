import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyShort, Button, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import SøkPerson from "../../../components/SøkPerson";
import type { Diskresjonskode, EktefellebidragSkjemaData, ForelderPartRolle } from "../../opprett-sak-schema";

type Props = {
    form: UseFormReturn<EktefellebidragSkjemaData>;
    forslagMotpart: PersonDto[];
    motsattRolle: ForelderPartRolle;
};

export default function EktefelleMotpartVelger({ form, forslagMotpart, motsattRolle }: Props) {
    const valgtIdent = form.watch("motpart.ident");

    const velgPerson = (person: PersonDto) => {
        form.setValue("motpart.ident", person.ident, { shouldDirty: true, shouldValidate: true });
        form.setValue("motpart.navn", person.visningsnavn, { shouldDirty: true });
        form.setValue("motpart.rolle", motsattRolle, { shouldDirty: true });
        form.setValue("motpart.erKjent", true, { shouldDirty: true });
        form.setValue("motpart.diskresjonskode", person.diskresjonskode as Diskresjonskode | undefined, {
            shouldDirty: true,
        });
    };

    const fjernValg = () => {
        form.setValue("motpart.ident", "", { shouldDirty: true, shouldValidate: true });
        form.setValue("motpart.navn", "", { shouldDirty: true });
        form.setValue("motpart.diskresjonskode", undefined, { shouldDirty: true });
    };

    const rolleLabel = motsattRolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker";

    return (
        <VStack gap="space-4">
            <BodyShort size="small" textColor="subtle">
                {forslagMotpart.length === 0
                    ? "Søk etter ektefelle/partner"
                    : "Velg ektefelle/partner fra listen eller søk etter en annen person"}
            </BodyShort>

            <VStack gap="space-8">
                {forslagMotpart.map((person) => {
                    const erValgt = valgtIdent === person.ident;
                    return (
                        <Button
                            key={person.ident}
                            type="button"
                            size="small"
                            variant="secondary"
                            aria-pressed={erValgt}
                            onClick={() => (erValgt ? fjernValg() : velgPerson(person))}
                        >
                            {erValgt ? "Fjern" : "Bruk"} {person.visningsnavn}
                        </Button>
                    );
                })}

                <SøkPerson label={`Søk etter ${rolleLabel}`} personInformasjon={velgPerson} compact />
            </VStack>
        </VStack>
    );
}
