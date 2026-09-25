import { Arbeidsfordeling, type OpprettSakRequest, Rolletype } from "@bidrag/api/SakApi";

export type SaksrollerArbeidsfordeling = "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
type Rolle = OpprettSakRequest["roller"][number];

export type OpprettSakRolle = {
    fodselsnummer?: string;
    type: Rolletype;
    rolleType?: Rolletype;
    mottagerErVerge?: boolean;
    reellMottaker?: { ident: string; verge: boolean } | null;
};

export type OpprettSakParter = {
    kategori: "Nasjonal" | "Utland";
    roller: OpprettSakRolle[];
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
 *
 * Siste kontroll før innsending fjerner roller uten fødselsnummer og krever RM på alle barn
 * når BM mangler.
 *
 * TODO(bidrag-sak): Backend regner BM som oppgitt så lenge det finnes en BM-rolle,
 * også når den mangler fødselsnummer. Da hopper `OpprettSakValidator` over kravet om
 * reell mottaker (RM) på barna, selv om BM lagres som ukjent (`ukjentPart = UK`).
 * Uten RM og uten kjent BM har bidraget ingen mottaker. Denne kontrollen dekker
 * hullet fra frontend. Fjern den når backend bare regner BM som oppgitt når
 * fødselsnummer finnes.
 */
export function lagOpprettSakRequest(
    enhet: string,
    arbeidsfordeling: SaksrollerArbeidsfordeling,
    { kategori, roller }: OpprettSakParter,
): OpprettSakRequest {
    return kontrollerOpprettSakRequest({
        eierfogd: enhet,
        kategori: kategori === "Nasjonal" ? "N" : "U",
        arbeidsfordeling: arbeidsfordelingTilEnum[arbeidsfordeling],
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
        roller: roller.map(normaliserRolle),
    } as OpprettSakRequest);
}

function normaliserRolle(rolle: OpprettSakRolle): Rolle {
    return {
        fodselsnummer: rolle.fodselsnummer,
        type: rolle.type,
        rolleType: rolle.rolleType ?? rolle.type,
        mottagerErVerge: rolle.mottagerErVerge ?? false,
        reellMottaker: rolle.reellMottaker ?? null,
    } as Rolle;
}

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
