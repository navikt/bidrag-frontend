import type { PersonDto } from "@bidrag/api/PersonApi";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import ForeslåPersonPanel from "../felles/ForeslåPersonPanel.tsx";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import type { Rolle, SakRedigeringData } from "../sakvisning-schema.ts";

interface LeggTilForelderProps {
    form: UseFormReturn<SakRedigeringData>;
    rolleType: "BP" | "BM";
    rolleNavn: string;
    muligeAndreForeldre?: PersonDto[];
}

export default function LeggTilForelder({
    form,
    rolleType,
    rolleNavn,
    muligeAndreForeldre = [],
}: LeggTilForelderProps) {
    const [visSøk, setVisSøk] = useState(false);
    useRegistrerÅpenRedigering(`legg-til-forelder-${rolleType}`, visSøk);
    const roller = form.watch("roller") || [];

    const forslagListe = muligeAndreForeldre.map((f) => ({
        ident: f.ident,
        navn: f.visningsnavn ?? f.navn ?? "Ukjent",
        fødselsdato: f.fødselsdato ?? undefined,
    }));

    const handlePersonValgt = (person: PersonDto) => {
        const denAndreForelderenType = rolleType === "BM" ? "BP" : "BM";
        const denAndreForelderen = roller.find((r) => r.type === denAndreForelderenType);
        const denAndreForelderenRolle = rolleType === "BM" ? "bidragspliktig" : "bidragsmottaker";

        if (denAndreForelderen?.fodselsnummer && denAndreForelderen.fodselsnummer === person.ident) {
            const personInfo = person?.visningsnavn
                ? `${person.visningsnavn} (${person.ident})`
                : person?.ident
                  ? `Denne personen (${person.ident})`
                  : "Denne personen";

            throw new Error(
                `${personInfo} er allerede registrert som ${denAndreForelderenRolle} og kan ikke legges til på nytt.`,
            );
        }

        const eksisterendeRolle = roller.find((r) => r.type === rolleType);
        const nyForelder: Rolle = {
            ...eksisterendeRolle,
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
            type: rolleType,
            rolleType,
            objektnummer: eksisterendeRolle?.objektnummer ?? "",
            reellMottager: undefined,
            reellMottaker: undefined,
            mottagerErVerge: false,
            samhandlerIdent: undefined,
        };
        const oppdaterteRoller = eksisterendeRolle
            ? roller.map((r) => (r.type === rolleType ? nyForelder : r))
            : [...roller, nyForelder];
        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
        setVisSøk(false);
    };

    return (
        <ForeslåPersonPanel
            tittel={`Legg til ${rolleNavn.toLowerCase()}`}
            beskrivelse={`Søk opp personen som skal være ${rolleNavn.toLowerCase()} i saken`}
            variant="warning"
            forslagListe={forslagListe}
            onVelgPerson={handlePersonValgt}
            onError={() => {}}
            søkLabel={`Søk etter ${rolleNavn.toLowerCase()}`}
        />
    );
}
