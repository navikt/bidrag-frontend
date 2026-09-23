import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { PersonTallShortIcon, PlusIcon } from "@navikt/aksel-icons";
import { Alert, Box, Button } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PersonInfo from "../components/PersonInfo";
import PersonSøkWrapper from "../components/PersonSøkWrapper";
import { type Barnkurv, type ForelderMedBarnSkjemaData, MAKS_ALDER_BARN } from "./opprett-sak-schema";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<ForelderMedBarnSkjemaData>;
    leggTilBarnManuell: (barn: PersonDto, alder: number) => void | Promise<void>;
};

export default function BarnManueltRegistrering({ form, leggTilBarnManuell, barnkurver }: Props) {
    const [visSøk, setVisSøk] = useState(false);
    const [funnetBarn, setFunnetBarn] = useState<{ person: PersonDto; alder: number }>();
    const [feil, setFeil] = useState<string>();

    const validerBarn = (barn: PersonDto) => {
        const valgteBarn = form.getValues("valgteBarn");

        if (valgteBarn.some((b) => b.ident === barn.ident)) {
            if (barn?.visningsnavn && barn?.ident) {
                throw new Error(
                    `${barn.visningsnavn} (${barn.ident}) er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.`,
                );
            } else if (barn?.ident) {
                throw new Error(
                    `Dette barnet (${barn.ident}) er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.`,
                );
            } else {
                throw new Error(
                    "Dette barnet er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.",
                );
            }
        }

        if (barnkurver?.some((kurv) => kurv.barn.some((s) => s.ident === barn.ident))) {
            if (barn?.visningsnavn && barn?.ident) {
                throw new Error(
                    `${barn.visningsnavn} (${barn.ident}) finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.`,
                );
            } else if (barn?.ident) {
                throw new Error(
                    `Dette barnet (${barn.ident}) finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.`,
                );
            } else {
                throw new Error(
                    "Dette barnet finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.",
                );
            }
        }

        const alder = beregnAlderForPerson(barn);

        if (alder === null) {
            throw new Error("Kunne ikke beregne alder for barnet.");
        }

        if (alder > MAKS_ALDER_BARN) {
            if (barn?.visningsnavn && barn?.ident) {
                throw new Error(
                    `${barn.visningsnavn} (${barn.ident}) er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
                );
            } else if (barn?.ident) {
                throw new Error(
                    `Dette barnet (${barn.ident}) er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
                );
            } else {
                throw new Error(`Barnet er over ${MAKS_ALDER_BARN} år og kan ikke legges til`);
            }
        }

        return alder;
    };

    const håndterSøk = (barn: PersonDto) => {
        const alder = validerBarn(barn);
        setFunnetBarn({ person: barn, alder });
        setFeil(undefined);
    };

    const lukk = () => {
        setVisSøk(false);
        setFunnetBarn(undefined);
        setFeil(undefined);
    };

    const leggTil = async () => {
        if (!funnetBarn) {
            setFeil("Søk opp barnet med fødselsnummer eller D-nummer først");
            return;
        }

        await leggTilBarnManuell(funnetBarn.person, funnetBarn.alder);
        lukk();
    };

    if (!visSøk) {
        return (
            <Box marginBlock="space-16 space-0">
                <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    icon={<PlusIcon aria-hidden />}
                    onClick={() => setVisSøk(true)}
                >
                    Legg til nytt barn
                </Button>
            </Box>
        );
    }

    return (
        <PersonSøkWrapper
            tittel="Legg til nytt barn i saken"
            beskrivelse="Søk opp barnet som skal legges til i saken"
            søkeLabel="Søk etter barn"
            onPersonValgt={håndterSøk}
            onAvbryt={lukk}
            ikon={<PersonTallShortIcon aria-hidden fontSize="1.5rem" />}
            actions={
                <>
                    <Button type="button" size="small" onClick={leggTil}>
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
                        <Alert variant="warning" inline size="small">
                            {feil}
                        </Alert>
                    )}
                    {funnetBarn && (
                        <Box padding="space-16" borderRadius="8" background="neutral-soft">
                            <PersonInfo
                                navn={funnetBarn.person.visningsnavn}
                                ident={funnetBarn.person.ident}
                                rolle="BA"
                                alder={funnetBarn.alder}
                                fødselsdato={funnetBarn.person.fødselsdato || ""}
                            />
                        </Box>
                    )}
                </>
            }
        />
    );
}
