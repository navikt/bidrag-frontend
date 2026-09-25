import { Arbeidsfordeling, type OpprettSakRequest, Rolletype } from "@bidrag/api/SakApi";

export type SaksrollerArbeidsfordeling = "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
type Rolle = OpprettSakRequest["roller"][number];
type Part = { ident?: string } | null | undefined;
type Barn = { ident: string; reellMottaker?: string };

export type OpprettSakParter = {
    kategori: "Nasjonal" | "Utland";
    bidragspliktig?: Part;
    bidragsmottaker?: Part;
    barn: Barn[];
};

const arbeidsfordelingTilEnum: Record<SaksrollerArbeidsfordeling, Arbeidsfordeling> = {
    BBF: Arbeidsfordeling.BBF,
    EEN: Arbeidsfordeling.EEN,
    EFS: Arbeidsfordeling.EFS,
    FRS: Arbeidsfordeling.FRS,
    INH: Arbeidsfordeling.INH,
    OPS: Arbeidsfordeling.OPS,
};

/**
 * Bygger requesten for alle sakstyper. BP og BM sendes bare når de har ident, slik at
 * ukjent part alltid sendes likt. Backend oppretter uansett ukjent BP/BM (`ukjentPart = UK`).
 */
export function lagOpprettSakRequest(
    enhet: string,
    arbeidsfordeling: SaksrollerArbeidsfordeling,
    { kategori, bidragspliktig, bidragsmottaker, barn }: OpprettSakParter,
): OpprettSakRequest {
    return kontrollerOpprettSakRequest({
        eierfogd: enhet,
        kategori: kategori === "Nasjonal" ? "N" : "U",
        arbeidsfordeling: arbeidsfordelingTilEnum[arbeidsfordeling],
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
        roller: [
            personRolle(bidragspliktig?.ident, Rolletype.BP),
            personRolle(bidragsmottaker?.ident, Rolletype.BM),
            ...barn.map(barnRolle),
        ],
    } as OpprettSakRequest);
}

/**
 * Siste kontroll av requesten før den sendes til bidrag-sak.
 *
 * TODO(bidrag-sak): Backend regner BM som oppgitt så lenge det finnes en BM-rolle,
 * også når den mangler fødselsnummer. Da hopper `OpprettSakValidator` over kravet om
 * reell mottaker (RM) på barna, selv om BM lagres som ukjent (`ukjentPart = UK`).
 * Uten RM og uten kjent BM har bidraget ingen mottaker. Denne kontrollen dekker
 * hullet fra frontend. Fjern den når backend bare regner BM som oppgitt når
 * fødselsnummer finnes.
 *
 * 1. Fjerner roller uten fødselsnummer.
 * 2. Krever RM på alle barn når BM mangler.
 */
function kontrollerOpprettSakRequest(request: OpprettSakRequest): OpprettSakRequest {
    const roller = request.roller.filter((rolle) => !!rolle.fodselsnummer?.trim());
    const harBidragsmottaker = roller.some((rolle) => rolle.type === Rolletype.BM);

    if (!harBidragsmottaker && roller.some((rolle) => rolle.type === Rolletype.BA && !harReellMottaker(rolle))) {
        throw new Error("Når bidragsmottaker er ukjent, må alle barn ha reell mottaker.");
    }

    return { ...request, roller };
}

function harReellMottaker(rolle: Rolle) {
    return !!rolle.reellMottaker?.ident?.trim();
}

function personRolle(fodselsnummer: string | undefined, type: Rolletype): Rolle {
    return { fodselsnummer, type, rolleType: type, mottagerErVerge: false } as Rolle;
}

function barnRolle(barn: Barn): Rolle {
    return {
        ...personRolle(barn.ident, Rolletype.BA),
        reellMottaker: barn.reellMottaker ? { ident: barn.reellMottaker, verge: false } : null,
    } as Rolle;
}
