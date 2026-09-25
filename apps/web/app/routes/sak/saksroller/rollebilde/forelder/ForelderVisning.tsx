import type { PersonDto } from "@bidrag/api/PersonApi";
import { PencilIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Button, HStack, Tag, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PersonSøkModal from "../../felles/person-søk/PersonSøkModal.tsx";
import { PersonSøkInnhold } from "../../felles/person-søk/PersonSøkWrapper.tsx";
import type { Rolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { fjernRolle } from "../endringer/rolle-endringer.ts";
import RollehistorikkVisning from "../RollehistorikkVisning.tsx";
import { ForelderKortInnhold } from "./ForelderKort.tsx";

interface ForelderVisningProps {
    form: UseFormReturn<SakRedigeringData>;
    rolle: Rolle;
    erNyForelder: boolean;
}

export default function ForelderVisning({ form, rolle, erNyForelder }: ForelderVisningProps) {
    const [visSøk, setVisSøk] = useState(false);
    const roller = form.watch("roller") || [];

    const forelderRolleNavn = rolle.type === "BP" ? "bidragspliktig" : "bidragsmottaker";

    const handlePersonValgt = (person: PersonDto) => {
        const nyForelder: Rolle = {
            ...rolle,
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
        };

        form.setValue("roller", erstattForelder(roller, nyForelder), { shouldValidate: true });
        setVisSøk(false);
    };

    return (
        <VStack gap="space-4">
            <ForelderKortInnhold
                forelder={{
                    ident: rolle.fodselsnummer,
                    navn: rolle.navn,
                    fødselsdato: rolle.fødselsdato,
                    diskresjonskode: rolle.diskresjonskode,
                }}
                rolle={forelderRolletype(rolle)}
                visModiaLenke
                visIkon={false}
                tags={
                    erNyForelder && (
                        <Tag variant="alt1" size="xsmall">
                            Ny
                        </Tag>
                    )
                }
            >
                <RollehistorikkVisning
                    rollehistorikk={rolle.rollehistorikk}
                    rolle={rolle}
                    saksnummer={form.getValues("saksnummer")}
                />
            </ForelderKortInnhold>
            {erNyForelder && (
                <ForelderHandlinger
                    visEndre={!visSøk}
                    onEndre={() => setVisSøk(true)}
                    onFjern={() => fjernRolle(form, rolle.fodselsnummer)}
                />
            )}

            {visSøk && (
                <PersonSøkModal tittel={`Endre ${forelderRolleNavn}`} onAvbryt={() => setVisSøk(false)}>
                    <PersonSøkInnhold
                        beskrivelse={`Søk opp personen som skal være ${forelderRolleNavn} i saken`}
                        søkeLabel={`Søk etter ${forelderRolleNavn}`}
                        onPersonValgt={handlePersonValgt}
                    />
                </PersonSøkModal>
            )}
        </VStack>
    );
}

function erstattForelder(roller: Rolle[], nyForelder: Rolle) {
    const finnesAllerede = roller.some((r) => r.type === nyForelder.type);
    if (!finnesAllerede) return [...roller, nyForelder];
    return roller.map((r) => (r.type === nyForelder.type ? nyForelder : r));
}

function forelderRolletype(rolle: Rolle) {
    return rolle.type === "BP" || rolle.type === "BM" ? rolle.type : undefined;
}

function ForelderHandlinger({
    visEndre,
    onEndre,
    onFjern,
}: {
    visEndre: boolean;
    onEndre: () => void;
    onFjern: () => void;
}) {
    return (
        <HStack gap="space-8" wrap={false}>
            {visEndre && (
                <Button
                    variant="tertiary"
                    type="button"
                    size="small"
                    icon={<PencilIcon aria-hidden />}
                    onClick={onEndre}
                >
                    Endre
                </Button>
            )}
            <Button type="button" size="small" variant="tertiary" icon={<XMarkIcon aria-hidden />} onClick={onFjern}>
                Fjern
            </Button>
        </HStack>
    );
}
