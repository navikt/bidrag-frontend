import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyLong, Button, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import {
    BarnPersonInfo,
    BarnSøkHandlinger,
    BarnSøkIkon,
    BarnSøkInnhold,
    barnSøkTittel,
    LeggTilBarnKnapp,
    useBarnSøk,
} from "../../felles/person-søk/BarnSøk.tsx";
import PersonSøkModal from "../../felles/person-søk/PersonSøkModal.tsx";
import { reellMottakerRegelForSak, reellMottakerValgregel } from "../../felles/reell-mottaker/reell-mottaker-regel.ts";
import { MYNDYG_BARN_ALDER, type SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import { alderForBarn, finnValideringsfeilForBarn, lagBarnRolle } from "./legg-til-barn-utils.ts";
import ReellMottakerVelger from "./ReellMottakerVelger.tsx";

interface LeggTilBarnProps {
    søsken?: PersonDto[];
    erOppfostringsbidrag?: boolean;
    visSøk: boolean;
    setVisSøk: (visSøk: boolean) => void;
}

export default function LeggTilBarn({ søsken = [], erOppfostringsbidrag, visSøk, setVisSøk }: LeggTilBarnProps) {
    const [valgtBarn, setValgtBarn] = useState<PersonDto | null>(null);
    const [visReellMottaker, setVisReellMottaker] = useState(false);

    useRegistrerÅpenRedigering("legg-til-barn", visSøk || visReellMottaker);

    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];

    const tilgjengeligeSøsken = søsken.filter(
        (søskenBarn) => !roller.some((rolle) => rolle.fodselsnummer === søskenBarn.ident),
    );

    const søk = useBarnSøk({
        valider: (person) => {
            const valideringsfeil = finnValideringsfeilForBarn(person, roller);
            if (valideringsfeil) throw new Error(valideringsfeil);
            return alderForBarn(person);
        },
        onLeggTil: ({ person }) => leggTil(person),
        onLukk: () => setVisSøk(false),
    });

    const leggTil = (person: PersonDto) => {
        const valideringsfeil = finnValideringsfeilForBarn(person, roller);
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
                regel={reellMottakerValgregel(
                    reellMottakerRegelForSak(
                        Boolean(erOppfostringsbidrag),
                        roller.find((rolle) => rolle.type === "BM")?.fodselsnummer,
                    ),
                    alderForBarn(valgtBarn) >= MYNDYG_BARN_ALDER,
                )}
            />
        );
    }

    if (!visSøk) {
        return <LeggTilBarnKnapp onClick={() => setVisSøk(true)} />;
    }

    const harBeggeForeldre = roller.some((i) => i.type === "BP") && roller.some((i) => i.type === "BM");

    return (
        <PersonSøkModal
            tittel={barnSøkTittel}
            ikon={<BarnSøkIkon />}
            onAvbryt={søk.lukk}
            actions={<BarnSøkHandlinger søk={søk} />}
        >
            <BarnSøkInnhold søk={søk}>
                {tilgjengeligeSøsken.length > 0 && (
                    <SøskenListe søsken={tilgjengeligeSøsken} harBeggeForeldre={harBeggeForeldre} onVelg={leggTil} />
                )}
            </BarnSøkInnhold>
        </PersonSøkModal>
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
