import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyLong, Button, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { alderForBarn, validerNyttBarn } from "../../felles/barn/barn-regler.ts";
import { BarnPersonInfo, LeggTilBarnSøk, useBarnSøk } from "../../felles/person-søk/BarnSøk.tsx";
import ReellMottakerValgGruppe, {
    type ReellMottakerValg,
    type ReellMottakerValgregel,
    useLagretSamhandler,
} from "../../felles/reell-mottaker/ReellMottakerValgGruppe.tsx";
import {
    initialiserValg,
    kanBekrefteReellMottaker,
    MANGLER_REELL_MOTTAKER_MELDING,
} from "../../felles/reell-mottaker/reell-mottaker-valg.ts";
import {
    MYNDYG_BARN_ALDER,
    reellMottakerRegel,
    reellMottakerValgregel,
    type Sakstype,
} from "../../felles/saksregler.ts";
import type { SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import { lagBarnRolle } from "./legg-til-barn-utils.ts";

interface LeggTilBarnProps {
    søsken?: PersonDto[];
    sakstype: Sakstype;
    visSøk: boolean;
    setVisSøk: (visSøk: boolean) => void;
}

export default function LeggTilBarn({ søsken = [], sakstype, visSøk, setVisSøk }: LeggTilBarnProps) {
    const [valgtReellMottaker, setValgtReellMottaker] = useState<{
        barnIdent: string;
        valg: ReellMottakerValg;
    }>();
    const [reellMottakerFeil, setReellMottakerFeil] = useState<{ barnIdent: string; melding: string }>();

    useRegistrerÅpenRedigering("legg-til-barn", visSøk);

    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];

    const tilgjengeligeSøsken = søsken.filter(
        (søskenBarn) => !roller.some((rolle) => rolle.fodselsnummer === søskenBarn.ident),
    );

    const finnValideringsfeil = (person: PersonDto) =>
        validerNyttBarn(person, { identerISaken: roller.map((rolle) => rolle.fodselsnummer) });

    const finnReellMottakerValgregel = (person: PersonDto): ReellMottakerValgregel | undefined =>
        reellMottakerValgregel(
            reellMottakerRegel(sakstype, !roller.find((rolle) => rolle.type === "BM")?.fodselsnummer),
            alderForBarn(person) >= MYNDYG_BARN_ALDER,
        );

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

        const regel = finnReellMottakerValgregel(person);
        const barn = { ident: person.ident, navn: person.visningsnavn };
        const valg = initialiserValg(
            valgtReellMottaker?.barnIdent === person.ident ? valgtReellMottaker.valg : {},
            regel ?? "valgfri",
            barn,
        );
        if (!kanBekrefteReellMottaker(valg, regel)) {
            setReellMottakerFeil({ barnIdent: person.ident, melding: MANGLER_REELL_MOTTAKER_MELDING });
            return;
        }

        const nyttBarn = {
            ...lagBarnRolle(person),
            reellMottakerType: valg.type,
            reellMottaker: valg.ident,
            reellMottakerNavn: valg.navn,
        };

        form.setValue("roller", [...roller, nyttBarn], { shouldValidate: true });

        søk.nullstill();
        setValgtReellMottaker(undefined);
        setReellMottakerFeil(undefined);
        if (tilgjengeligeSøsken.length <= 1) {
            søk.lukk();
        }
    };

    const harBeggeForeldre = roller.some((i) => i.type === "BP") && roller.some((i) => i.type === "BM");
    const funnetBarn = søk.funnetBarn;
    const funnetBarnValgregel = funnetBarn ? finnReellMottakerValgregel(funnetBarn.person) : undefined;

    return (
        <LeggTilBarnSøk
            søk={søk}
            visSøk={visSøk}
            onÅpne={() => setVisSøk(true)}
            innholdPåFunnetBarn={
                funnetBarn &&
                funnetBarnValgregel && (
                    <NyttBarnReellMottaker
                        key={funnetBarn.person.ident}
                        barn={funnetBarn.person}
                        regel={funnetBarnValgregel}
                        valg={
                            valgtReellMottaker?.barnIdent === funnetBarn.person.ident
                                ? valgtReellMottaker.valg
                                : undefined
                        }
                        feil={
                            reellMottakerFeil?.barnIdent === funnetBarn.person.ident
                                ? reellMottakerFeil.melding
                                : undefined
                        }
                        onValg={(valg) => setValgtReellMottaker({ barnIdent: funnetBarn.person.ident, valg })}
                        onFeil={(melding) =>
                            setReellMottakerFeil(melding ? { barnIdent: funnetBarn.person.ident, melding } : undefined)
                        }
                    />
                )
            }
        >
            {tilgjengeligeSøsken.length > 0 && (
                <SøskenListe
                    søsken={tilgjengeligeSøsken}
                    harBeggeForeldre={harBeggeForeldre}
                    onVelg={(person) => {
                        try {
                            søk.håndterSøk(person);
                        } catch (error) {
                            søk.setFeil(error instanceof Error ? error.message : String(error));
                        }
                    }}
                />
            )}
        </LeggTilBarnSøk>
    );
}

function NyttBarnReellMottaker({
    barn,
    regel,
    valg: lagretValg,
    feil,
    onValg,
    onFeil,
}: {
    barn: PersonDto;
    regel: ReellMottakerValgregel;
    valg?: ReellMottakerValg;
    feil?: string;
    onValg: (valg: ReellMottakerValg) => void;
    onFeil: (feil: string) => void;
}) {
    const valg = initialiserValg(lagretValg ?? {}, regel, {
        ident: barn.ident,
        navn: barn.visningsnavn,
    });
    const { lagretSamhandler, huskSamhandler } = useLagretSamhandler(valg);

    const handleValg = (nyttValg: ReellMottakerValg) => {
        huskSamhandler(valg, nyttValg);
        onValg(nyttValg);
        onFeil("");
    };

    return (
        <ReellMottakerValgGruppe
            barnNavn={barn.visningsnavn}
            barnIdent={barn.ident}
            valg={valg}
            lagretSamhandler={lagretSamhandler}
            onValg={handleValg}
            regel={regel}
            feil={feil}
        />
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
