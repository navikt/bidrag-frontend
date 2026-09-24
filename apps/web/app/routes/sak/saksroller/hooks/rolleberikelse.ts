import type { PersonDto } from "@bidrag/api/PersonApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { beregnAlderForPerson } from "@bidrag/utils";
import type { BarnRolle, Rolle } from "../sakvisning-schema.ts";
import { MYNDYG_BARN_ALDER } from "../sakvisning-schema.ts";

export function berikRoller(
    roller: RolleDto[],
    personInfoMap: Map<string | undefined, PersonDto | undefined>,
): Rolle[] {
    return [...roller]
        .sort((a, b) => a.fodselsnummer?.localeCompare(b.fodselsnummer || "") || a.type.localeCompare(b.type))
        .map((rolle): Rolle => {
            const personInfo = rolle.fodselsnummer ? personInfoMap.get(rolle.fodselsnummer) : undefined;
            const alder = beregnAlderForPerson({
                fødselsdato: personInfo?.fødselsdato,
                ident: rolle.fodselsnummer ?? "",
            });

            if (rolle.type === "BA" && rolle.fodselsnummer) {
                const erMyndig = (alder ?? 0) >= MYNDYG_BARN_ALDER;
                return {
                    ...rolle,
                    rolleType: "BA",
                    fodselsnummer: rolle.fodselsnummer,
                    objektnummer: rolle.objektnummer ?? "",
                    reellMottager: rolle.reellMottager ?? undefined,
                    foedselsnummer: rolle.foedselsnummer ?? undefined,
                    mottagerErVerge: rolle.mottagerErVerge ?? false,
                    fødselsdato: personInfo?.fødselsdato,
                    navn: personInfo?.visningsnavn,
                    diskresjonskode: personInfo?.diskresjonskode,
                    reellMottaker: rolle.reellMottaker?.ident,
                    reellMottakerType: rolle.reellMottaker?.ident?.trim()
                        ? rolle.fodselsnummer === rolle.reellMottaker.ident
                            ? "barnet_selv"
                            : "samhandler"
                        : undefined,
                    alder: alder ?? undefined,
                    erMyndig,
                    rollehistorikk: mapRollehistorikk(rolle),
                } as BarnRolle;
            }

            return {
                ...rolle,
                objektnummer: rolle.objektnummer ?? "",
                reellMottaker: undefined,
                reellMottager: undefined,
                foedselsnummer: rolle.foedselsnummer ?? undefined,
                fødselsdato: personInfo?.fødselsdato,
                fodselsnummer: rolle.fodselsnummer || "",
                mottagerErVerge: rolle.mottagerErVerge ?? false,
                navn: personInfo?.visningsnavn,
                diskresjonskode: personInfo?.diskresjonskode,
                rollehistorikk: mapRollehistorikk(rolle),
            } as Rolle;
        });
}

const mapRollehistorikk = (rolle: RolleDto): Rolle["rollehistorikk"] =>
    (rolle.rollehistorikk?.map((historikk) => ({
        ...historikk,
        opprettetDato: historikk.opprettetTidspunkt ? new Date(historikk.opprettetTidspunkt) : undefined,
        type: rolletypeTilVisningsnavn(historikk.type),
        typeEndring: historikk.typeEndring || "Manuell endring",
        reellMottaker: historikk.reellMottaker?.ident,
    })) as Rolle["rollehistorikk"]) ?? [];

function rolletypeTilVisningsnavn(rolle?: Rolletype): string {
    if (!rolle) return "";
    switch (rolle) {
        case Rolletype.BM:
            return "Bidragsmottaker";
        case Rolletype.BA:
            return "Barn";
        case Rolletype.BP:
            return "Bidragspliktig";
        default:
            return rolle;
    }
}
