import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils";
import { PlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, Button, Heading } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import PersonInfo from "./components/PersonInfo.tsx";
import PersonSøkWrapper from "./PersonSøkWrapper.tsx";
import ReellMottakerVelger from "./ReellMottakerVelger.tsx";
import { type BarnRolle, MYNDYG_BARN_ALDER, type SakRedigeringData } from "./sakvisning-schema.ts";

const MAKS_ALDER_BARN = 24;

interface LeggTilBarnProps {
    hentOgNullstillSamhandler: (barnIndex: number, isLeggTilBarn: boolean) => { ident: string; navn: string } | null;
    søsken?: PersonDto[];
    erOppfostringsbidrag?: boolean;
    visSøk?: boolean;
    setVisSøk?: (v: boolean) => void;
}

export default function LeggTilBarn({
    hentOgNullstillSamhandler,
    søsken = [],
    erOppfostringsbidrag = false,
    ...props
}: LeggTilBarnProps) {
    const [internalVisSøk, setInternalVisSøk] = useState(false);
    const visSøk = typeof props.visSøk === "boolean" ? props.visSøk : internalVisSøk;
    const setVisSøk = props.setVisSøk ?? setInternalVisSøk;
    const [valgtBarn, setValgtBarn] = useState<PersonDto | null>(null);
    const [visReellMottaker, setVisReellMottaker] = useState(false);

    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];
    // Filtrer ut søsken som allerede er lagt til i saken
    const tilgjengeligeSøsken = søsken.filter(
        (søskenBarn) => !roller.some((rolle) => rolle.fodselsnummer === søskenBarn.ident),
    );

    const handlePersonValgt = (person: PersonDto) => {
        if (roller.some((b) => b.fodselsnummer === person.ident)) {
            if (person?.visningsnavn && person?.ident) {
                throw new Error(`${person.visningsnavn} (${person.ident}) er allerede lagt til i saken`);
            } else if (person?.ident) {
                throw new Error(`Dette barnet (${person.ident}) er allerede lagt til`);
            } else {
                throw new Error("Dette barnet er allerede lagt til");
            }
        }

        const alder = person?.fødselsdato ? beregnAlder(person.fødselsdato) : (beregnAlderFraFnr(person.ident) ?? 0);

        if (alder > MAKS_ALDER_BARN) {
            if (person?.visningsnavn && person?.ident) {
                throw new Error(
                    `${person.visningsnavn} (${person.ident}) er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
                );
            } else if (person?.ident) {
                throw new Error(
                    `Dette barnet (${person.ident}) er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
                );
            } else {
                throw new Error(`Barnet er over ${MAKS_ALDER_BARN} år og kan ikke legges til`);
            }
        }

        setValgtBarn(person);

        const bm = roller.find((r) => r.type === "BM");
        const erBmUkjent = !bm?.fodselsnummer;

        const erMyndig = alder >= MYNDYG_BARN_ALDER;

        if (erMyndig || erBmUkjent) {
            setVisReellMottaker(true);
            leggTilBarn(person, undefined, undefined, undefined, false);
        } else {
            leggTilBarn(person);
        }
    };

    const leggTilBarn = (
        person: PersonDto,
        reellMottakerType?: "barnet_selv" | "samhandler",
        reellMottakerIdent?: string,
        reellMottakerNavn?: string,
        reset: boolean = true,
    ) => {
        const alder = person?.fødselsdato ? beregnAlder(person.fødselsdato) : (beregnAlderFraFnr(person.ident) ?? 0);

        const nyttBarn: BarnRolle = {
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            type: "BA",
            rolleType: "BA",
            objektnummer: "",
            reellMottager: reellMottakerType === "samhandler" ? reellMottakerIdent : undefined,
            reellMottaker:
                reellMottakerType === "samhandler"
                    ? reellMottakerIdent
                    : reellMottakerType === "barnet_selv"
                      ? person.ident
                      : undefined,
            mottagerErVerge: false,
            samhandlerIdent: reellMottakerType === "samhandler" ? reellMottakerIdent : undefined,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
            alder,
            erMyndig: alder >= MYNDYG_BARN_ALDER,
            reellMottakerType: reellMottakerType,
            reellMottakerNavn:
                reellMottakerType === "samhandler"
                    ? reellMottakerNavn
                    : reellMottakerType === "barnet_selv"
                      ? (person.visningsnavn ?? undefined)
                      : undefined,
        };

        const oppdaterteRoller = [...roller, nyttBarn];
        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });

        if (reset) {
            resetEtterBarnLagtTil();
        }
    };

    const resetEtterBarnLagtTil = () => {
        if (tilgjengeligeSøsken.length <= 1) {
            resetState();
        } else {
            setValgtBarn(null);
            setVisReellMottaker(false);
        }
    };

    const resetState = () => {
        setVisSøk(false);
        setValgtBarn(null);
        setVisReellMottaker(false);
    };

    if (!visSøk) {
        return (
            <div className="flex justify-end">
                <Button
                    icon={<PlusIcon aria-hidden />}
                    variant="secondary"
                    size="xsmall"
                    type="button"
                    onClick={() => setVisSøk(true)}
                >
                    Legg til barn
                </Button>
            </div>
        );
    }

    if (!valgtBarn) {
        const bp = roller.find((i) => i.type === "BP");
        const bm = roller.find((i) => i.type === "BM");
        return (
            <PersonSøkWrapper
                tittel="Legg til nytt barn i saken"
                beskrivelse="Søk opp barnet som skal legges til i saken"
                søkeLabel="Søk etter barn"
                onPersonValgt={handlePersonValgt}
                onAvbryt={resetState}
            >
                {tilgjengeligeSøsken.length > 0 && (
                    <div className="mb-4 p-3 bg-ax-bg-default rounded-lg">
                        <Heading level="4" size="xsmall" spacing>
                            Andre barn som kan legges til ({tilgjengeligeSøsken.length})
                        </Heading>
                        <BodyLong size="small" className="text-ax-neutral-800 mb-3">
                            {bp && bm
                                ? "Andre barn som har begge foreldrene til felles"
                                : "Andre barn som deler forelder med barn i saken"}
                        </BodyLong>
                        <div className="space-y-2">
                            {tilgjengeligeSøsken.map((søskenBarn) => {
                                const alder = søskenBarn?.fødselsdato
                                    ? beregnAlder(søskenBarn.fødselsdato)
                                    : beregnAlderFraFnr(søskenBarn.ident);

                                return (
                                    <Button
                                        key={søskenBarn.ident}
                                        type="button"
                                        variant="tertiary"
                                        className="w-full justify-start"
                                        onClick={() => handlePersonValgt(søskenBarn)}
                                    >
                                        <PersonInfo
                                            navn={søskenBarn?.visningsnavn}
                                            ident={søskenBarn?.ident}
                                            alder={alder ?? undefined}
                                            fødselsdato={søskenBarn?.fødselsdato || ""}
                                        />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </PersonSøkWrapper>
        );
    }

    const alder = valgtBarn?.fødselsdato
        ? beregnAlder(valgtBarn.fødselsdato)
        : (beregnAlderFraFnr(valgtBarn.ident) ?? 0);
    const bm = roller.find((r) => r.type === "BM");
    const erBmUkjent = !bm?.fodselsnummer;
    const rolleIndex = roller.findIndex((r) => r.fodselsnummer === valgtBarn.ident);
    const reellMottakerPaakrevd = alder >= MYNDYG_BARN_ALDER || erBmUkjent;

    return (
        <div className="mt-3 p-4 bg-ax-accent-100 rounded-lg">
            <Alert variant="info" className="mb-4">
                <BodyLong size="small">
                    <strong>{`${valgtBarn.visningsnavn} (${valgtBarn.ident})`}</strong>
                    {alder >= MYNDYG_BARN_ALDER
                        ? " er over 18 år og krever reell mottaker."
                        : erBmUkjent
                          ? " - Bidragsmottaker er ukjent, velg reell mottaker."
                          : ""}
                </BodyLong>
            </Alert>

            {visReellMottaker && (
                <ReellMottakerVelger
                    barnNavn={valgtBarn.visningsnavn ?? ""}
                    rolleIndex={rolleIndex}
                    onAvbryt={resetEtterBarnLagtTil}
                    onSelect={resetEtterBarnLagtTil}
                    isRequired={reellMottakerPaakrevd}
                    kunSamhandlerSomReellMottaker={erOppfostringsbidrag}
                />
            )}
        </div>
    );
}
