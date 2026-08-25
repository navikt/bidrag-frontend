import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonSokButton } from "@bidrag/common";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils";
import { PersonTallShortIcon, PlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, Button, Detail, Heading, HStack, Modal, Search, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router";

import { useHentSamhandlerEllerPersonForIdent } from "~/api/useApi.ts";
import PersonInfo from "./components/PersonInfo.tsx";
import ReellMottakerVelger from "./ReellMottakerVelger.tsx";
import { type BarnRolle, MYNDYG_BARN_ALDER, type SakRedigeringData } from "./sakvisning-schema.ts";

const MAKS_ALDER_BARN = 24;

interface LeggTilBarnProps {
    søsken?: PersonDto[];
    erOppfostringsbidrag?: boolean;
    visSøk?: boolean;
    setVisSøk?: (v: boolean) => void;
}

export default function LeggTilBarn({ søsken = [], ...props }: LeggTilBarnProps) {
    const [internalVisSøk, setInternalVisSøk] = useState(false);
    const visSøk = typeof props.visSøk === "boolean" ? props.visSøk : internalVisSøk;
    const setVisSøk = props.setVisSøk ?? setInternalVisSøk;
    const [ident, setIdent] = useState("");
    const [feil, setFeil] = useState<string | undefined>(undefined);
    const [valgtBarn, setValgtBarn] = useState<PersonDto | null>(null);
    const [visReellMottaker, setVisReellMottaker] = useState(false);

    const søkFn = useHentSamhandlerEllerPersonForIdent(false);
    const { saksnummer } = useParams();
    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];

    const tilgjengeligeSøsken = søsken.filter(
        (søskenBarn) => !roller.some((rolle) => rolle.fodselsnummer === søskenBarn.ident),
    );

    const alderFor = (person: PersonDto) =>
        person?.fødselsdato ? beregnAlder(person.fødselsdato) : (beregnAlderFraFnr(person.ident) ?? 0);

    const finnValideringsfeil = (person: PersonDto): string | undefined => {
        if (roller.some((b) => b.fodselsnummer === person.ident)) {
            return person.visningsnavn
                ? `${person.visningsnavn} (${person.ident}) er allerede lagt til i saken`
                : `Dette barnet (${person.ident}) er allerede lagt til`;
        }

        const personAlder = alderFor(person);
        if (personAlder > MAKS_ALDER_BARN) {
            return `${person.visningsnavn ?? "Barnet"} er ${personAlder} år og kan ikke legges til. Maks alder er ${MAKS_ALDER_BARN} år.`;
        }

        return undefined;
    };

    const leggTil = (person: PersonDto) => {
        const valideringsfeil = finnValideringsfeil(person);
        if (valideringsfeil) {
            setFeil(valideringsfeil);
            return;
        }

        const personAlder = alderFor(person);
        const nyttBarn: BarnRolle = {
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            type: "BA",
            rolleType: "BA",
            objektnummer: "",
            mottagerErVerge: false,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
            alder: personAlder,
            erMyndig: personAlder >= MYNDYG_BARN_ALDER,
        };

        form.setValue("roller", [...roller, nyttBarn], { shouldValidate: true });

        const bm = roller.find((rolle) => rolle.type === "BM");
        const reellMottakerPåkrevd = nyttBarn.erMyndig || !bm?.fodselsnummer;

        if (reellMottakerPåkrevd) {
            setValgtBarn(person);
            setVisReellMottaker(true);
            setVisSøk(false);
            setFeil(undefined);
        } else if (tilgjengeligeSøsken.length <= 1) {
            lukk();
        } else {
            setIdent("");
            setFeil(undefined);
        }
    };

    const handleLeggTil = async () => {
        if (!ident.trim()) {
            setFeil("Skriv inn fødselsnummer eller D-nummer");
            return;
        }

        try {
            const treff = await søkFn.mutateAsync({ ident: ident.trim() });
            if (!treff?.isValid) {
                setFeil("Finner ingen person med oppgitt fødselsnummer");
                return;
            }
            leggTil(treff as PersonDto);
        } catch {
            setFeil("Finner ingen person med oppgitt fødselsnummer");
        }
    };

    const lukk = () => {
        setVisSøk(false);
        setIdent("");
        setFeil(undefined);
    };

    const resetEtterReellMottaker = () => {
        setVisReellMottaker(false);
        setValgtBarn(null);
        setIdent("");
        setFeil(undefined);
    };

    if (visReellMottaker && valgtBarn) {
        const rolleIndex = roller.findIndex((rolle) => rolle.fodselsnummer === valgtBarn.ident);
        const bm = roller.find((rolle) => rolle.type === "BM");
        const reellMottakerPåkrevd = alderFor(valgtBarn) >= MYNDYG_BARN_ALDER || !bm?.fodselsnummer;

        return (
            <ReellMottakerVelger
                barnNavn={valgtBarn.visningsnavn ?? "Barnet"}
                rolleIndex={rolleIndex}
                onAvbryt={resetEtterReellMottaker}
                onBekreft={resetEtterReellMottaker}
                kanFjerne={!reellMottakerPåkrevd}
                isRequired={reellMottakerPåkrevd}
                kunSamhandlerSomReellMottaker={props.erOppfostringsbidrag}
            />
        );
    }

    if (!visSøk) {
        return (
            <Button
                icon={<PlusIcon aria-hidden />}
                variant="secondary"
                size="small"
                type="button"
                className="self-start"
                onClick={() => setVisSøk(true)}
            >
                Legg til nytt barn
            </Button>
        );
    }

    const bp = roller.find((i) => i.type === "BP");
    const bm = roller.find((i) => i.type === "BM");

    return (
        <Modal open onClose={lukk} width="medium" aria-label="Legg til nytt barn i saken">
            <Modal.Header>
                <VStack gap="space-2">
                    {saksnummer && <Detail>Sak {saksnummer}</Detail>}
                    <HStack gap="space-4" align="center" wrap={false}>
                        <PersonTallShortIcon aria-hidden fontSize="1.5rem" />
                        <Heading level="2" size="medium">
                            Legg til nytt barn i saken
                        </Heading>
                    </HStack>
                </VStack>
            </Modal.Header>

            <Modal.Body>
                <VStack gap="space-16">
                    <BodyLong size="small" textColor="subtle">
                        Søk opp barnet som skal legges til i saken
                    </BodyLong>

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
                                        className="w-full justify-start"
                                        onClick={() => leggTil(søskenBarn)}
                                    >
                                        <PersonInfo
                                            navn={søskenBarn?.visningsnavn}
                                            ident={søskenBarn?.ident}
                                            rolle="BA"
                                            alder={alderFor(søskenBarn)}
                                            fødselsdato={søskenBarn?.fødselsdato || ""}
                                        />
                                    </Button>
                                ))}
                            </VStack>
                        </VStack>
                    )}

                    <HStack gap="space-16" align="end" wrap={false}>
                        <Search
                            label="Søk etter barn"
                            description="Fødselsnummer eller D-nummer (11 siffer)"
                            variant="simple"
                            size="small"
                            hideLabel={false}
                            value={ident}
                            onChange={(verdi) => {
                                setIdent(verdi);
                                setFeil(undefined);
                            }}
                        />
                        <PersonSokButton
                            onError={(melding) => setFeil(melding)}
                            onResult={(data) => {
                                if (data?.ident) {
                                    setIdent(data.ident);
                                    setFeil(undefined);
                                }
                            }}
                        />
                    </HStack>

                    {feil && (
                        <Alert variant="warning" inline size="small">
                            {feil}
                        </Alert>
                    )}
                </VStack>
            </Modal.Body>

            <Modal.Footer>
                <Button type="button" onClick={handleLeggTil} loading={søkFn.isPending}>
                    Legg til
                </Button>
                <Button type="button" variant="secondary" onClick={lukk}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
