import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonTallShortIcon, PlusIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, Heading, InlineMessage, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import PersonInfo from "../components/PersonInfo.tsx";
import PersonSøkModal from "../components/PersonSøkModal.tsx";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import ReellMottakerVelger from "../ReellMottakerVelger.tsx";
import { MYNDYG_BARN_ALDER, type SakRedigeringData } from "../sakvisning-schema.ts";
import { alderForBarn, finnValideringsfeilForBarn, lagBarnRolle } from "./legg-til-barn-utils.ts";

interface LeggTilBarnProps {
    søsken?: PersonDto[];
    erOppfostringsbidrag?: boolean;
    visSøk: boolean;
    setVisSøk: (visSøk: boolean) => void;
}

export default function LeggTilBarn({ søsken = [], erOppfostringsbidrag, visSøk, setVisSøk }: LeggTilBarnProps) {
    const [feil, setFeil] = useState<string | undefined>(undefined);
    const [valgtBarn, setValgtBarn] = useState<PersonDto | null>(null);
    const [visReellMottaker, setVisReellMottaker] = useState(false);
    const [funnetPerson, setFunnetPerson] = useState<PersonDto | null>(null);

    useRegistrerÅpenRedigering("legg-til-barn", visSøk || visReellMottaker);

    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];

    const tilgjengeligeSøsken = søsken.filter(
        (søskenBarn) => !roller.some((rolle) => rolle.fodselsnummer === søskenBarn.ident),
    );

    const leggTil = (person: PersonDto) => {
        const valideringsfeil = finnValideringsfeilForBarn(person, roller);
        if (valideringsfeil) {
            setFeil(valideringsfeil);
            return;
        }

        const nyttBarn = lagBarnRolle(person);

        form.setValue("roller", [...roller, nyttBarn], { shouldValidate: true });

        const bm = roller.find((rolle) => rolle.type === "BM");
        const reellMottakerPåkrevd = nyttBarn.erMyndig || !bm?.fodselsnummer;

        setFunnetPerson(null);

        if (reellMottakerPåkrevd) {
            setValgtBarn(person);
            setVisReellMottaker(true);
            setVisSøk(false);
            setFeil(undefined);
        } else if (tilgjengeligeSøsken.length <= 1) {
            lukk();
        } else {
            setFeil(undefined);
        }
    };

    const handleSøkResultat = (person: PersonDto) => {
        const valideringsfeil = finnValideringsfeilForBarn(person, roller);
        if (valideringsfeil) {
            setFunnetPerson(null);
            throw new Error(valideringsfeil);
        }

        setFeil(undefined);
        setFunnetPerson(person);
    };

    const handleLeggTil = () => {
        if (!funnetPerson) {
            setFeil("Søk opp barnet med fødselsnummer eller D-nummer først");
            return;
        }
        leggTil(funnetPerson);
    };

    const lukk = () => {
        setVisSøk(false);
        setFeil(undefined);
        setFunnetPerson(null);
    };

    const resetEtterReellMottaker = () => {
        setVisReellMottaker(false);
        setValgtBarn(null);
        setFeil(undefined);
        setFunnetPerson(null);
    };

    if (visReellMottaker && valgtBarn) {
        const rolleIndex = roller.findIndex((rolle) => rolle.fodselsnummer === valgtBarn.ident);
        const bm = roller.find((rolle) => rolle.type === "BM");
        const reellMottakerPåkrevd = alderForBarn(valgtBarn) >= MYNDYG_BARN_ALDER || !bm?.fodselsnummer;

        return (
            <ReellMottakerVelger
                barnNavn={valgtBarn.visningsnavn ?? "Barnet"}
                barnIdent={valgtBarn.ident}
                verdi={{}}
                onAvbryt={resetEtterReellMottaker}
                onBekreft={(valg) => {
                    form.setValue(`roller.${rolleIndex}.reellMottakerType`, valg.type);
                    form.setValue(`roller.${rolleIndex}.reellMottaker`, valg.ident);
                    form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, valg.navn, { shouldValidate: true });
                    resetEtterReellMottaker();
                }}
                regel={erOppfostringsbidrag ? "kun-samhandler" : reellMottakerPåkrevd ? "påkrevd" : "valgfri"}
            />
        );
    }

    if (!visSøk) {
        return (
            <Box marginBlock="space-16 space-0">
                <Button
                    icon={<PlusIcon aria-hidden />}
                    variant="secondary"
                    size="small"
                    type="button"
                    onClick={() => setVisSøk(true)}
                >
                    Legg til nytt barn
                </Button>
            </Box>
        );
    }

    const bp = roller.find((i) => i.type === "BP");
    const bm = roller.find((i) => i.type === "BM");

    return (
        <PersonSøkModal
            tittel="Legg til nytt barn i saken"
            beskrivelse="Søk opp barnet som skal legges til i saken"
            søkeLabel="Søk etter barn"
            onPersonValgt={handleSøkResultat}
            onQueryChange={() => {
                setFunnetPerson(null);
                setFeil(undefined);
            }}
            onAvbryt={lukk}
            ikon={<PersonTallShortIcon aria-hidden />}
            actions={
                <>
                    <Button type="button" size="small" onClick={handleLeggTil}>
                        Legg til
                    </Button>
                    <Button type="button" size="small" variant="secondary" onClick={lukk}>
                        Avbryt
                    </Button>
                </>
            }
            resultat={
                <>
                    {feil && (
                        <InlineMessage status="warning" size="small">
                            {feil}
                        </InlineMessage>
                    )}

                    {funnetPerson && (
                        <Box padding="space-16" borderRadius="8" background="neutral-soft">
                            <PersonInfo
                                navn={funnetPerson.visningsnavn}
                                ident={funnetPerson.ident}
                                rolle="BA"
                                alder={alderForBarn(funnetPerson)}
                                fødselsdato={funnetPerson.fødselsdato || ""}
                            />
                        </Box>
                    )}
                </>
            }
        >
            <VStack gap="space-16">
                {tilgjengeligeSøsken.length > 0 && (
                    <VStack gap="space-8">
                        <Heading level="3" size="xsmall">
                            Andre barn som kan legges til ({tilgjengeligeSøsken.length})
                        </Heading>
                        <BodyLong size="small" textColor="subtle">
                            {bp && bm
                                ? "Andre barn som har begge foreldrene til felles"
                                : "Andre barn som deler forelder med barn i saken"}
                        </BodyLong>
                        <VStack gap="space-2">
                            {tilgjengeligeSøsken.map((søskenBarn) => (
                                <Button
                                    key={søskenBarn.ident}
                                    type="button"
                                    variant="tertiary"
                                    size="small"
                                    className="w-full justify-start"
                                    onClick={() => leggTil(søskenBarn)}
                                >
                                    <PersonInfo
                                        navn={søskenBarn?.visningsnavn}
                                        ident={søskenBarn?.ident}
                                        rolle="BA"
                                        alder={alderForBarn(søskenBarn)}
                                        fødselsdato={søskenBarn?.fødselsdato || ""}
                                    />
                                </Button>
                            ))}
                        </VStack>
                    </VStack>
                )}
            </VStack>
        </PersonSøkModal>
    );
}
