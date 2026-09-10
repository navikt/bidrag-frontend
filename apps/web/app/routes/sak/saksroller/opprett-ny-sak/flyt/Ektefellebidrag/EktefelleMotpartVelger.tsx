import type { PersonDto } from "@bidrag/api/PersonApi";
import { PlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Button, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import SøkPerson from "../../../components/SøkPerson";
import type { Diskresjonskode, EktefellebidragSkjemaData, ForelderPartRolle } from "../../opprett-sak-schema";
import PersonKort from "./PersonKort";

type Props = {
    form: UseFormReturn<EktefellebidragSkjemaData>;
    forslagMotpart: PersonDto[];
    motsattRolle: ForelderPartRolle;
};

export default function EktefelleMotpartVelger({ form, forslagMotpart, motsattRolle }: Props) {
    const [visSøkefelt, setVisSøkefelt] = useState(false);
    const [søktPerson, setSøktPerson] = useState<PersonDto | null>(null);

    const valgtIdent = form.watch("motpart.ident");
    const feilmelding = form.formState.errors.motpart?.ident?.message;
    const erValgtFraForslag = forslagMotpart.some((p) => p.ident === valgtIdent);
    const erValgtFraSøk = valgtIdent && !erValgtFraForslag;

    const velgPerson = (person: PersonDto, fraSøk = false) => {
        form.setValue("motpart.ident", person.ident);
        form.setValue("motpart.navn", person.visningsnavn);
        form.setValue("motpart.rolle", motsattRolle);
        form.setValue("motpart.erKjent", true);
        form.setValue("motpart.diskresjonskode", person.diskresjonskode as Diskresjonskode | undefined);
        setSøktPerson(fraSøk ? person : null);
        setVisSøkefelt(false);
    };

    const fjernValg = () => {
        form.setValue("motpart.ident", "");
        form.setValue("motpart.navn", "");
        form.setValue("motpart.diskresjonskode", undefined);
        setSøktPerson(null);
    };

    const rolleLabel = motsattRolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker";

    return (
        <VStack gap="space-4">
            <Heading level="2" size="medium">
                Velg {rolleLabel}
            </Heading>

            <BodyShort size="small" className="text-ax-neutral-700">
                {forslagMotpart.length === 0
                    ? "Søk etter ektefelle/partner"
                    : "Velg ektefelle/partner fra listen eller søk etter en annen person"}
            </BodyShort>

            <VStack gap="space-2">
                {forslagMotpart.map((person) => {
                    const erValgt = valgtIdent === person.ident;
                    return (
                        <PersonKort
                            key={person.ident}
                            person={person}
                            erValgt={erValgt}
                            onClick={() => (erValgt ? fjernValg() : velgPerson(person))}
                        />
                    );
                })}

                {erValgtFraSøk && søktPerson && <PersonKort person={søktPerson} erValgt onClick={fjernValg} />}

                {!visSøkefelt ? (
                    <Button
                        type="button"
                        size="xsmall"
                        className="w-max"
                        onClick={() => setVisSøkefelt(true)}
                        icon={<PlusIcon aria-hidden />}
                        variant="tertiary"
                    >
                        <BodyShort size="small">Søk etter annen person</BodyShort>
                    </Button>
                ) : (
                    <div className="space-y-3 p-4 rounded-lg border-2 border-solid border-ax-accent-400 bg-ax-accent-100">
                        <SøkPerson
                            label={`Søk etter ${rolleLabel}`}
                            personInformasjon={(person) => velgPerson(person, true)}
                        />
                        <Button type="button" onClick={() => setVisSøkefelt(false)} variant="tertiary" size="small">
                            Avbryt søk
                        </Button>
                    </div>
                )}
            </VStack>

            {feilmelding && <Alert variant="error">{feilmelding}</Alert>}
        </VStack>
    );
}
