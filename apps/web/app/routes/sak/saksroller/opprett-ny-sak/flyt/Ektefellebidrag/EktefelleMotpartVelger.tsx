import type { PersonDto } from "@bidrag/api/PersonApi";
import { PlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Box, Button, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PersonSøkModal from "../../../components/PersonSøkModal";
import { PersonKortInnhold } from "../../../felles/PersonKort";
import type { Diskresjonskode, EktefellebidragSkjemaData, ForelderPartRolle } from "../../opprett-sak-schema";

type Props = {
    form: UseFormReturn<EktefellebidragSkjemaData>;
    forslagMotpart: PersonDto[];
    motsattRolle: ForelderPartRolle;
};

function PersonValg({ person, erValgt, onClick }: { person: PersonDto; erValgt: boolean; onClick: () => void }) {
    return (
        <Box
            asChild
            width="100%"
            padding="space-16"
            borderRadius="8"
            borderWidth="2"
            background={erValgt ? "success-soft" : "default"}
            borderColor={erValgt ? "success-strong" : "neutral"}
        >
            <button type="button" onClick={onClick}>
                <PersonKortInnhold person={person} erValgt={erValgt} />
            </button>
        </Box>
    );
}

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

            <BodyShort size="small" textColor="subtle">
                {forslagMotpart.length === 0
                    ? "Søk etter ektefelle/partner"
                    : "Velg ektefelle/partner fra listen eller søk etter en annen person"}
            </BodyShort>

            <VStack gap="space-2">
                {forslagMotpart.map((person) => {
                    const erValgt = valgtIdent === person.ident;
                    return (
                        <PersonValg
                            key={person.ident}
                            person={person}
                            erValgt={erValgt}
                            onClick={() => (erValgt ? fjernValg() : velgPerson(person))}
                        />
                    );
                })}

                {erValgtFraSøk && søktPerson && <PersonValg person={søktPerson} erValgt onClick={fjernValg} />}

                {!visSøkefelt ? (
                    <Button
                        type="button"
                        size="xsmall"
                        onClick={() => setVisSøkefelt(true)}
                        icon={<PlusIcon aria-hidden />}
                        variant="tertiary"
                    >
                        <BodyShort size="small">Søk etter annen person</BodyShort>
                    </Button>
                ) : (
                    <PersonSøkModal
                        tittel={`Søk etter ${rolleLabel}`}
                        beskrivelse="Søk opp personen som skal være motpart i saken"
                        søkeLabel={`Søk etter ${rolleLabel}`}
                        onPersonValgt={(person) => velgPerson(person, true)}
                        onAvbryt={() => setVisSøkefelt(false)}
                    />
                )}
            </VStack>

            {feilmelding && <Alert variant="error">{feilmelding}</Alert>}
        </VStack>
    );
}
