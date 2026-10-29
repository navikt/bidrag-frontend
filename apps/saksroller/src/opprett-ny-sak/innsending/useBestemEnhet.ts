import type { TilgangsFeilError } from "@bidrag/api";
import { type Arbeidsfordeling, Behandlingstype } from "@bidrag/api/OrganisasjonApi";
import { sakskategoriTilEnum } from "@bidrag/utils/visningsnavnUtils";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useMemo } from "react";
import { hentPersonGeografiskEnhetQueryOptions } from "../../api/enhet.api";
import type { BarnMedAlder } from "../skjema/opprett-sak-schema";

function tilGyldigSakskategori(sakskategori?: string): "U" | "N" | undefined {
    return sakskategori === "U" || sakskategori === "N" ? sakskategori : undefined;
}

type Part = { ident?: string } | null;

type BestemEnhetParams = {
    bidragspliktig: Part;
    bidragsmottaker: Part;
    barn: BarnMedAlder[];
    arbeidsfordeling?: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    sakskategori?: string;
};

type BestemEnhetResult = {
    enhet: string | null;
    enhetNavn: string | null;
    isLoading: boolean;
    error: AxiosError<string> | TilgangsFeilError | null;
};

function harIdent(ident?: string): ident is string {
    return !!ident && ident.trim() !== "";
}

function finnHovedident(bidragspliktig: Part, bidragsmottaker: Part, barn: BarnMedAlder[]): string | null {
    const [yngsteBarn] = [...barn].filter((b) => harIdent(b.ident)).sort((a, b) => a.alder - b.alder);
    return [bidragsmottaker?.ident, yngsteBarn?.ident, bidragspliktig?.ident].find(harIdent) ?? null;
}

function samleIdenter(bidragspliktig: Part, bidragsmottaker: Part, barn: BarnMedAlder[]): string[] {
    return [bidragspliktig?.ident, bidragsmottaker?.ident, ...barn.map((b) => b.ident)].filter(harIdent);
}

/**
 * Finner enheten saken skal sendes til ved å spørre arbeidsfordelingen i Norg med alle partene.
 * Norg avgjør adressebeskyttelse, egne ansatte og utland ut fra partene og sakskategorien.
 * bidrag-sak håndhever skjermet enhet ved opprettelse.
 */
export function useBestemEnhet({
    bidragspliktig,
    bidragsmottaker,
    barn,
    sakskategori,
    arbeidsfordeling,
}: BestemEnhetParams): BestemEnhetResult {
    const hovedident = finnHovedident(bidragspliktig, bidragsmottaker, barn);
    const biidenter = useMemo(
        () => samleIdenter(bidragspliktig, bidragsmottaker, barn).filter((ident) => ident !== hovedident),
        [bidragspliktig?.ident, bidragsmottaker?.ident, barn, hovedident],
    );
    const gyldigSakskategori = tilGyldigSakskategori(sakskategoriTilEnum(sakskategori as unknown as string));

    const norg = useQuery(
        hentPersonGeografiskEnhetQueryOptions(
            hovedident
                ? {
                      ident: hovedident,
                      biidenter,
                      tema: "BID",
                      sakskategori: gyldigSakskategori,
                      behandlingstype: Behandlingstype.SOKNAD,
                      arbeidsfordeling: (arbeidsfordeling ?? "EEN") as Arbeidsfordeling,
                  }
                : null,
        ),
    );

    return {
        enhet: norg.data?.nummer ?? null,
        enhetNavn: norg.data?.navn ?? null,
        isLoading: norg.isLoading || norg.isFetching,
        error: (norg.error as BestemEnhetResult["error"]) ?? null,
    };
}
