import type { PersonDto } from "@bidrag/api/PersonApi";
import { PencilIcon, TrashIcon } from "@navikt/aksel-icons";
import { Button, Tag, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { PersonSøkInnhold } from "../../felles/person-søk/PersonSøkWrapper.tsx";
import RedigeringsRamme from "../../felles/RedigeringsRamme.tsx";
import type { Rolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { fjernRolle } from "../endringer/rolle-endringer.ts";
import RollehistorikkVisning from "../RollehistorikkVisning.tsx";
import { ForelderKortInnhold } from "./ForelderKort.tsx";
import { finnDuplikatForelderFeil } from "./forelder-regler.ts";

interface ForelderVisningProps {
    form: UseFormReturn<SakRedigeringData>;
    rolle: Rolle;
    erNyForelder: boolean;
    søktIdent?: string;
    onPersonValgt?: (person: PersonDto) => void;
}

export default function ForelderVisning({ form, rolle, erNyForelder, søktIdent, onPersonValgt }: ForelderVisningProps) {
    const [visSøk, setVisSøk] = useState(false);
    const roller = form.watch("roller") || [];

    const forelderRolleNavn = rolle.type === "BP" ? "bidragspliktig" : "bidragsmottaker";

    const handlePersonValgt = (person: PersonDto) => {
        const rolleType = forelderRolletype(rolle);
        const duplikatFeil = rolleType && finnDuplikatForelderFeil(roller, rolleType, person);
        if (duplikatFeil) {
            throw new Error(duplikatFeil);
        }

        const nyForelder: Rolle = {
            ...rolle,
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
        };

        form.setValue("roller", erstattForelder(roller, nyForelder), { shouldValidate: true });
        onPersonValgt?.(person);
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
                søktIdent={søktIdent}
                tags={
                    erNyForelder && (
                        <Tag variant="alt1" size="xsmall">
                            Ny
                        </Tag>
                    )
                }
                headingActions={
                    erNyForelder && <FjernForelderHandling onFjern={() => fjernRolle(form, rolle.fodselsnummer)} />
                }
            >
                <RollehistorikkVisning
                    rollehistorikk={rolle.rollehistorikk}
                    rolle={rolle}
                    saksnummer={form.getValues("saksnummer")}
                />
            </ForelderKortInnhold>
            {erNyForelder && <ForelderHandlinger visEndre={!visSøk} onEndre={() => setVisSøk(true)} />}

            {visSøk && (
                <RedigeringsRamme tittel={`Endre ${forelderRolleNavn}`} onAvbryt={() => setVisSøk(false)}>
                    <PersonSøkInnhold
                        beskrivelse={`Søk opp personen som skal være ${forelderRolleNavn} i saken`}
                        søkeLabel={`Søk etter ${forelderRolleNavn}`}
                        onPersonValgt={handlePersonValgt}
                    />
                </RedigeringsRamme>
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

function ForelderHandlinger({ visEndre, onEndre }: { visEndre: boolean; onEndre: () => void }) {
    if (!visEndre) return null;

    return (
        <Button variant="tertiary" type="button" size="small" icon={<PencilIcon aria-hidden />} onClick={onEndre}>
            Endre
        </Button>
    );
}

function FjernForelderHandling({ onFjern }: { onFjern: () => void }) {
    return (
        <Button
            type="button"
            size="small"
            variant="tertiary"
            icon={<TrashIcon aria-hidden />}
            aria-label="Fjern forelder"
            onClick={onFjern}
        />
    );
}
