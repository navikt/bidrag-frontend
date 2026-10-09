import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyLong, Button, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { alderForBarn, validerNyttBarn } from "../../felles/barn/barn-regler.ts";
import { BarnPersonInfo, LeggTilBarnSøk, useBarnSøk } from "../../felles/person-søk/BarnSøk.tsx";
import {
    MYNDYG_BARN_ALDER,
    reellMottakerRegel,
    reellMottakerValgregel,
    type Sakstype,
} from "../../felles/saksregler.ts";
import type { SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import { lagBarnRolle } from "./legg-til-barn-utils.ts";
import ReellMottakerVelger from "./ReellMottakerVelger.tsx";

interface LeggTilBarnProps {
    søsken?: PersonDto[];
    sakstype: Sakstype;
    visSøk: boolean;
    setVisSøk: (visSøk: boolean) => void;
}

export default function LeggTilBarn({ søsken = [], sakstype, visSøk, setVisSøk }: LeggTilBarnProps) {
    const [valgtBarn, setValgtBarn] = useState<PersonDto | null>(null);
    const [visReellMottaker, setVisReellMottaker] = useState(false);

    useRegistrerÅpenRedigering("legg-til-barn", visSøk || visReellMottaker);

    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];

    const tilgjengeligeSøsken = søsken.filter(
        (søskenBarn) => !roller.some((rolle) => rolle.fodselsnummer === søskenBarn.ident),
    );

    const finnValideringsfeil = (person: PersonDto) =>
        validerNyttBarn(person, { identerISaken: roller.map((rolle) => rolle.fodselsnummer) });

    const søk = useBarnSøk({
        valider: (person) => {
            const valideringsfeil = finnValideringsfeil(person);
            if (valideringsfeil) throw new Error(valideringsfeil);
            return alderForBarn(person);
        },
        onLeggTil: ({ person }) => leggTil(person),
        onLukk: () => setVisSøk(false),
    });

    const leggTil = (person: PersonDto) => {
        const valideringsfeil = finnValideringsfeil(person);
        if (valideringsfeil) {
            søk.setFeil(valideringsfeil);
            return;
        }

        const nyttBarn = lagBarnRolle(person);

        form.setValue("roller", [...roller, nyttBarn], { shouldValidate: true });

        const harBidragsmottaker = roller.some((rolle) => rolle.type === "BM" && rolle.fodselsnummer);

        søk.nullstill();

        if (nyttBarn.erMyndig || !harBidragsmottaker) {
            setValgtBarn(person);
            setVisReellMottaker(true);
            setVisSøk(false);
        } else if (tilgjengeligeSøsken.length <= 1) {
            søk.lukk();
        }
    };

    const resetEtterReellMottaker = () => {
        setVisReellMottaker(false);
        setValgtBarn(null);
        søk.nullstill();
    };

    if (visReellMottaker && valgtBarn) {
        const rolleIndex = roller.findIndex((rolle) => rolle.fodselsnummer === valgtBarn.ident);
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
                regel={
                    reellMottakerValgregel(
                        reellMottakerRegel(sakstype, !roller.find((rolle) => rolle.type === "BM")?.fodselsnummer),
                        alderForBarn(valgtBarn) >= MYNDYG_BARN_ALDER,
                    ) ?? "valgfri"
                }
            />
        );
    }

    const harBeggeForeldre = roller.some((i) => i.type === "BP") && roller.some((i) => i.type === "BM");

    return (
        <LeggTilBarnSøk søk={søk} visSøk={visSøk} onÅpne={() => setVisSøk(true)}>
            {tilgjengeligeSøsken.length > 0 && (
                <SøskenListe søsken={tilgjengeligeSøsken} harBeggeForeldre={harBeggeForeldre} onVelg={leggTil} />
            )}
        </LeggTilBarnSøk>
    );
}

function SøskenListe({
    søsken,
    harBeggeForeldre,
    onVelg,
}: {
    søsken: PersonDto[];
    harBeggeForeldre: boolean;
    onVelg: (barn: PersonDto) => void;
}) {
    return (
        <VStack gap="space-8">
            <Heading level="3" size="xsmall">
                Andre barn som kan legges til ({søsken.length})
            </Heading>
            <BodyLong size="small" textColor="subtle">
                {harBeggeForeldre
                    ? "Andre barn som har begge foreldrene til felles"
                    : "Andre barn som deler forelder med barn i saken"}
            </BodyLong>
            <VStack gap="space-2">
                {søsken.map((søskenBarn) => (
                    <Button
                        key={søskenBarn.ident}
                        type="button"
                        variant="tertiary"
                        size="small"
                        className="w-full justify-start"
                        onClick={() => onVelg(søskenBarn)}
                    >
                        <BarnPersonInfo person={søskenBarn} alder={alderForBarn(søskenBarn)} />
                    </Button>
                ))}
            </VStack>
        </VStack>
    );
}
