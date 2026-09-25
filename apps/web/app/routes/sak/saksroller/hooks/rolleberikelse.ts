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
    return [...roller].sort(sammenlignRoller).map((rolle) => berikRolle(rolle, personInfoMap));
}

const sammenlignRoller = (a: RolleDto, b: RolleDto): number =>
    a.fodselsnummer?.localeCompare(b.fodselsnummer || "") || a.type.localeCompare(b.type);

function berikRolle(rolle: RolleDto, personInfoMap: Map<string | undefined, PersonDto | undefined>): Rolle {
    const personInfo = rolle.fodselsnummer ? personInfoMap.get(rolle.fodselsnummer) : undefined;
    const alder = beregnAlderForPerson({
        fødselsdato: personInfo?.fødselsdato,
        ident: rolle.fodselsnummer ?? "",
    });

    if (rolle.type === "BA" && rolle.fodselsnummer) {
        return berikBarnRolle(rolle, personInfo, alder);
    }

    return berikStandardRolle(rolle, personInfo);
}

function berikBarnRolle(
    rolle: RolleDto,
    personInfo: PersonDto | undefined,
    alder: number | null | undefined,
): BarnRolle {
    return {
        ...rolle,
        ...fellesRollefelter(rolle, personInfo),
        rolleType: "BA",
        fodselsnummer: rolle.fodselsnummer,
        reellMottager: rolle.reellMottager ?? undefined,
        reellMottaker: rolle.reellMottaker?.ident,
        reellMottakerType: utledReellMottakerType(rolle),
        alder: alder ?? undefined,
        erMyndig: (alder ?? 0) >= MYNDYG_BARN_ALDER,
    } as BarnRolle;
}

function utledReellMottakerType(rolle: RolleDto): BarnRolle["reellMottakerType"] {
    const reellMottakerIdent = rolle.reellMottaker?.ident?.trim();
    if (!reellMottakerIdent) return undefined;
    return rolle.fodselsnummer === reellMottakerIdent ? "barnet_selv" : "samhandler";
}

function fellesRollefelter(rolle: RolleDto, personInfo: PersonDto | undefined) {
    return {
        objektnummer: rolle.objektnummer ?? "",
        foedselsnummer: rolle.foedselsnummer ?? undefined,
        mottagerErVerge: rolle.mottagerErVerge ?? false,
        fødselsdato: personInfo?.fødselsdato,
        navn: personInfo?.visningsnavn,
        diskresjonskode: personInfo?.diskresjonskode,
        rollehistorikk: mapRollehistorikk(rolle),
    };
}

function berikStandardRolle(rolle: RolleDto, personInfo: PersonDto | undefined): Rolle {
    return {
        ...rolle,
        ...fellesRollefelter(rolle, personInfo),
        reellMottaker: undefined,
        reellMottager: undefined,
        fodselsnummer: rolle.fodselsnummer || "",
    } as Rolle;
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
