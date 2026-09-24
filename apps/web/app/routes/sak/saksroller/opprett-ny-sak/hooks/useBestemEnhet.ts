import type { TilgangsFeilError } from "@bidrag/api";
import type { Arbeidsfordeling } from "@bidrag/api/OrganisasjonApi";
import { sakskategoriTilEnum } from "@bidrag/utils/visningsnavnUtils";
import { useQueries } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useMemo } from "react";
import { hentPersonGeografiskEnhetQueryOptions, useHentEnhetInfomasjon } from "~/api/useApi.ts";
import {
    type BarnMedAlder,
    type BarnMedReellMottaker,
    BarnMedReellMottakerSchema,
    DiskresjonskodeSchema,
    type ForelderMedRolle,
    type Motpart,
    type PartISaken,
} from "../opprett-sak-schema";

const ADRESSEBESKYTTELSE_ENHET = "2103";
const EGEN_ANSATT_ENHET = "4883";
const UTLAND_ENHET = "4865";

/**
 * Normaliserer sakskategori til de gyldige verdiene HentEnhetRequest forventer.
 * Sakskategori kommer allerede normalisert via sakskategoriTilEnum hos kallerne,
 * men typen er løsere ("string") der ute, så vi smalner den trygt her.
 */
function tilGyldigSakskategori(sakskategori?: string): "U" | "N" | undefined {
    return sakskategori === "U" || sakskategori === "N" ? sakskategori : undefined;
}

type BestemEnhetParams = {
    bidragspliktig: PartISaken | Motpart | ForelderMedRolle | null;
    bidragsmottaker: PartISaken | Motpart | ForelderMedRolle | null;
    barn: BarnMedAlder[] | BarnMedReellMottaker;
    arbeidsfordeling?: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    sakskategori?: string;
};

type BestemEnhetResult = {
    enhet: string | null;
    enhetNavn: string | null;
    isLoading: boolean;
    harFortroligAdresse: boolean;
    harEgenAnsatt: boolean;
    identForArbeidsfordeling: string | null;
    error: AxiosError<string> | TilgangsFeilError | null;
};

function harFortroligAdresse(diskresjonskode?: string): boolean {
    if (!diskresjonskode) return false;
    return DiskresjonskodeSchema.safeParse(diskresjonskode).success;
}

function sjekkFortroligAdresseForParter(
    bidragspliktig: PartISaken | Motpart | ForelderMedRolle | null,
    bidragsmottaker: PartISaken | Motpart | ForelderMedRolle | null,
    barn: BarnMedAlder[] | BarnMedReellMottaker,
): boolean {
    const barnArray = Array.isArray(barn) ? barn : [barn];
    const harBPFortroligAdresse = harFortroligAdresse(bidragspliktig?.diskresjonskode);
    const harBMFortroligAdresse = harFortroligAdresse(bidragsmottaker?.diskresjonskode);
    const harBarnFortroligAdresse = barnArray.some((b) => harFortroligAdresse(b.diskresjonskode));

    return harBPFortroligAdresse || harBMFortroligAdresse || harBarnFortroligAdresse;
}

// Bruker bidragsmottaker hvis kjent, ellers yngste barn
function finnIdentForArbeidsfordeling(
    bidragsmottaker: PartISaken | Motpart | ForelderMedRolle | null,
    barn: BarnMedAlder[] | BarnMedReellMottaker,
): string | null {
    if (bidragsmottaker?.ident && bidragsmottaker.ident.trim() !== "") {
        return bidragsmottaker.ident;
    }

    const valideringBarnMedReellMottaker = BarnMedReellMottakerSchema.safeParse(barn);
    if (valideringBarnMedReellMottaker.success) {
        return (barn as BarnMedReellMottaker).ident;
    }

    if (Array.isArray(barn) && barn.length > 0) {
        const [yngsteBarn] = [...barn].sort((a, b) => a.alder - b.alder);
        if (yngsteBarn) {
            return yngsteBarn.ident;
        }
    }

    return null;
}

type Part = PartISaken | Motpart | ForelderMedRolle | null;
type PersonIdent = { ident: string; rolle: "bp" | "bm" | "barn" };

function harIdent(ident?: string): ident is string {
    return !!ident && ident.trim() !== "";
}

function samleIdenter(bidragspliktig: Part, bidragsmottaker: Part, barn: BestemEnhetParams["barn"]): PersonIdent[] {
    const barnArray = Array.isArray(barn) ? barn : [barn];
    const kandidater: { ident?: string; rolle: PersonIdent["rolle"] }[] = [
        { ident: bidragspliktig?.ident, rolle: "bp" },
        { ident: bidragsmottaker?.ident, rolle: "bm" },
        ...barnArray.map((b) => ({ ident: b.ident, rolle: "barn" as const })),
    ];
    return kandidater.filter((p): p is PersonIdent => harIdent(p.ident));
}

function useSpesialenhet(enhetsnummer: string, aktiv: boolean): EnhetInfo {
    const { data, isLoading, isFetching, error } = useHentEnhetInfomasjon(enhetsnummer, aktiv);
    return { navn: data?.navn, isLoading: isLoading || isFetching, error };
}

function useGeografiskeEnheter(
    identer: PersonIdent[],
    identForArbeidsfordeling: string | null,
    { sakskategori, arbeidsfordeling }: Pick<BestemEnhetParams, "sakskategori" | "arbeidsfordeling">,
    aktiv: boolean,
) {
    const enhetQueries = useQueries({
        queries: identer.map((person) =>
            hentPersonGeografiskEnhetQueryOptions(
                {
                    ident: person.ident,
                    biidenter: [],
                    tema: "BID",
                    sakskategori: tilGyldigSakskategori(sakskategori),
                    arbeidsfordeling: (arbeidsfordeling ?? "EEN") as Arbeidsfordeling,
                },
                aktiv,
            ),
        ),
    });

    const egenAnsattEnhet = enhetQueries.find((query) => query.data?.nummer === EGEN_ANSATT_ENHET)?.data;
    const index = identer.findIndex((p) => p.ident === identForArbeidsfordeling);

    return {
        harEgenAnsatt: !!egenAnsattEnhet,
        standardEnhet: identForArbeidsfordeling && index !== -1 ? (enhetQueries[index]?.data ?? null) : null,
        isLoading: enhetQueries.some((q) => q.isLoading || q.isFetching),
        error: enhetQueries.find((q) => q.error)?.error ?? null,
    };
}

/**
 * Hook for å bestemme hvilken enhet saken skal sendes til.
 * Henter enhet basert på parter og arbeidsfordeling.
 *
 * Prioritering:
 * 1. Hvis noen av partene har fortrolig adresse, returneres enhet 2103
 * 2. Hvis noen av partene har enhet 4883 (egen ansatt), returneres enhet 4883
 * 3. Ellers brukes enhet til bidragsmottaker, eller yngste barn hvis BM er ukjent
 *
 * @example
 * ```tsx
 * const { enhet, enhetNavn, isLoading, harFortroligAdresse, harEgenAnsatt } = useBestemEnhet({
 *     bidragspliktig,
 *     bidragsmottaker,
 *     barn: valgteBarn,
 * });
 *
 * if (enhet) {
 *     return <Alert>Saken vil bli sendt til enhet {enhetNavn} ({enhet})</Alert>;
 * }
 * ```
 */
export function useBestemEnhet({
    bidragspliktig,
    bidragsmottaker,
    barn,
    sakskategori,
    arbeidsfordeling,
}: BestemEnhetParams): BestemEnhetResult {
    const harFortroligAdresseVerdi = useMemo(
        () => sjekkFortroligAdresseForParter(bidragspliktig, bidragsmottaker, barn),
        [bidragspliktig, bidragsmottaker, barn],
    );
    const erSakskategoriUtenlandssak = sakskategoriTilEnum(sakskategori as unknown as string) === "U";
    const alleIdenter = useMemo(
        () => samleIdenter(bidragspliktig, bidragsmottaker, barn),
        [bidragspliktig?.ident, bidragsmottaker?.ident, barn],
    );
    const identForArbeidsfordeling = useMemo(
        () => finnIdentForArbeidsfordeling(bidragsmottaker, barn),
        [bidragsmottaker?.ident, barn],
    );

    const geografisk = useGeografiskeEnheter(
        alleIdenter,
        identForArbeidsfordeling,
        { sakskategori, arbeidsfordeling },
        !harFortroligAdresseVerdi,
    );

    const utland = useSpesialenhet(UTLAND_ENHET, erSakskategoriUtenlandssak);
    const fortrolig = useSpesialenhet(ADRESSEBESKYTTELSE_ENHET, harFortroligAdresseVerdi);
    const egenAnsatt = useSpesialenhet(EGEN_ANSATT_ENHET, geografisk.harEgenAnsatt && !harFortroligAdresseVerdi);

    return velgEnhet({
        erSakskategoriUtenlandssak,
        harFortroligAdresse: harFortroligAdresseVerdi,
        harEgenAnsatt: geografisk.harEgenAnsatt,
        identForArbeidsfordeling,
        standardEnhet: geografisk.standardEnhet,
        standardLoading: geografisk.isLoading,
        standardError: geografisk.error,
        utland,
        fortrolig,
        egenAnsatt: {
            navn: egenAnsatt.navn,
            isLoading: geografisk.isLoading || egenAnsatt.isLoading,
            error: egenAnsatt.error ?? geografisk.error,
        },
    });
}

type EnhetInfo = {
    navn?: string | null;
    isLoading: boolean;
    error: BestemEnhetResult["error"];
};

function spesialenhet(
    enhet: string,
    info: EnhetInfo,
    standardNavn: string | null,
    flagg: Partial<Pick<BestemEnhetResult, "harFortroligAdresse" | "harEgenAnsatt" | "identForArbeidsfordeling">>,
): BestemEnhetResult {
    return {
        enhet,
        enhetNavn: info.navn ?? standardNavn,
        isLoading: info.isLoading,
        harFortroligAdresse: false,
        harEgenAnsatt: false,
        identForArbeidsfordeling: null,
        error: info.error,
        ...flagg,
    };
}

function velgEnhet({
    erSakskategoriUtenlandssak,
    harFortroligAdresse,
    harEgenAnsatt,
    identForArbeidsfordeling,
    standardEnhet,
    standardLoading,
    standardError,
    utland,
    fortrolig,
    egenAnsatt,
}: {
    erSakskategoriUtenlandssak: boolean;
    harFortroligAdresse: boolean;
    harEgenAnsatt: boolean;
    identForArbeidsfordeling: string | null;
    standardEnhet: { nummer?: string | null; navn?: string | null } | null;
    standardLoading: boolean;
    standardError: BestemEnhetResult["error"];
    utland: EnhetInfo;
    fortrolig: EnhetInfo;
    egenAnsatt: EnhetInfo;
}): BestemEnhetResult {
    if (erSakskategoriUtenlandssak) {
        return spesialenhet(UTLAND_ENHET, utland, null, { harFortroligAdresse: true });
    }

    if (harFortroligAdresse) {
        return spesialenhet(ADRESSEBESKYTTELSE_ENHET, fortrolig, "NAV Vikafossen", { harFortroligAdresse: true });
    }

    if (harEgenAnsatt) {
        return spesialenhet(EGEN_ANSATT_ENHET, egenAnsatt, "NAV Egne ansatte", {
            harEgenAnsatt: true,
            identForArbeidsfordeling,
        });
    }

    return {
        enhet: standardEnhet?.nummer ?? null,
        enhetNavn: standardEnhet?.navn ?? null,
        isLoading: standardLoading,
        harFortroligAdresse: false,
        harEgenAnsatt: false,
        identForArbeidsfordeling,
        error: standardError,
    };
}
