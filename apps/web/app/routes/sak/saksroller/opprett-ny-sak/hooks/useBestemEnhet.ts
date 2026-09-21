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

export const ADRESSEBESKYTTELSE_ENHET = "2103";
export const EGEN_ANSATT_ENHET = "4883";
export const UTLAND_ENHET = "4865";

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

    const erSakskategoriUtenlandssak = useMemo(
        () => sakskategoriTilEnum(sakskategori as unknown as string) === "U",
        [sakskategori],
    );
    const alleIdenter = useMemo(() => {
        const barnArray = Array.isArray(barn) ? barn : [barn];
        const identer: { ident: string; rolle: "bp" | "bm" | "barn" }[] = [];

        if (bidragspliktig?.ident && bidragspliktig.ident.trim() !== "") {
            identer.push({ ident: bidragspliktig.ident, rolle: "bp" });
        }
        if (bidragsmottaker?.ident && bidragsmottaker.ident.trim() !== "") {
            identer.push({ ident: bidragsmottaker.ident, rolle: "bm" });
        }
        barnArray.forEach((b: BarnMedAlder | BarnMedReellMottaker) => {
            if (b.ident && b.ident.trim() !== "") {
                identer.push({ ident: b.ident, rolle: "barn" });
            }
        });

        return identer;
    }, [bidragspliktig?.ident, bidragsmottaker?.ident, barn]);

    const enhetQueries = useQueries({
        queries: alleIdenter.map((person) =>
            hentPersonGeografiskEnhetQueryOptions(
                {
                    ident: person.ident,
                    biidenter: [],
                    tema: "BID",
                    sakskategori: tilGyldigSakskategori(sakskategori),
                    arbeidsfordeling: (arbeidsfordeling ?? "EEN") as Arbeidsfordeling,
                },
                !harFortroligAdresseVerdi,
            ),
        ),
    });

    const identForArbeidsfordeling = useMemo(
        () => finnIdentForArbeidsfordeling(bidragsmottaker, barn),
        [bidragsmottaker?.ident, barn],
    );

    const egenAnsattInfo = useMemo(() => {
        for (let i = 0; i < enhetQueries.length; i++) {
            const query = enhetQueries[i];
            if (!query) continue;
            if (query.data?.nummer === EGEN_ANSATT_ENHET) {
                return { harEgenAnsatt: true, enhetNavn: query.data.navn };
            }
        }
        return { harEgenAnsatt: false, enhetNavn: null };
    }, [enhetQueries]);

    const bmEllerBarnEnhet = useMemo(() => {
        if (!identForArbeidsfordeling) return null;
        const index = alleIdenter.findIndex((p) => p.ident === identForArbeidsfordeling);
        if (index === -1) return null;
        return enhetQueries[index]?.data ?? null;
    }, [alleIdenter, enhetQueries, identForArbeidsfordeling]);

    const isLoading = enhetQueries.some((q) => q.isLoading || q.isFetching);
    const error = enhetQueries.find((q) => q.error)?.error ?? null;
    const {
        data: utlandEnhetInfo,
        isLoading: isLoadingUtlandEnhet,
        isFetching: isFetchingUtlandEnhet,
        error: utlandEnhetError,
    } = useHentEnhetInfomasjon(UTLAND_ENHET, erSakskategoriUtenlandssak);
    const {
        data: fortroligEnhetInfo,
        isLoading: isLoadingFortroligEnhet,
        isFetching: isFetchingFortroligEnhet,
        error: fortroligEnhetError,
    } = useHentEnhetInfomasjon(ADRESSEBESKYTTELSE_ENHET, harFortroligAdresseVerdi);

    const {
        data: egenAnsattEnhetInfo,
        isLoading: isLoadingEgenAnsattEnhet,
        isFetching: isFetchingEgenAnsattEnhet,
        error: egenAnsattEnhetError,
    } = useHentEnhetInfomasjon(EGEN_ANSATT_ENHET, egenAnsattInfo.harEgenAnsatt && !harFortroligAdresseVerdi);

    if (erSakskategoriUtenlandssak) {
        return {
            enhet: UTLAND_ENHET,
            enhetNavn: utlandEnhetInfo?.navn ?? null,
            isLoading: isLoadingUtlandEnhet || isFetchingUtlandEnhet,
            harFortroligAdresse: true,
            harEgenAnsatt: false,
            identForArbeidsfordeling: null,
            error: utlandEnhetError,
        };
    }

    // 1. Returner fortrolig adresse enhet hvis noen har fortrolig adresse
    if (harFortroligAdresseVerdi) {
        return {
            enhet: ADRESSEBESKYTTELSE_ENHET,
            enhetNavn: fortroligEnhetInfo?.navn ?? "NAV Vikafossen",
            isLoading: isLoadingFortroligEnhet || isFetchingFortroligEnhet,
            harFortroligAdresse: true,
            harEgenAnsatt: false,
            identForArbeidsfordeling: null,
            error: fortroligEnhetError,
        };
    }

    // 2. Returner egen ansatt enhet hvis noen har enhet 4883
    if (egenAnsattInfo.harEgenAnsatt) {
        return {
            enhet: EGEN_ANSATT_ENHET,
            enhetNavn: egenAnsattEnhetInfo?.navn ?? "NAV Egne ansatte",
            isLoading: isLoading || isLoadingEgenAnsattEnhet || isFetchingEgenAnsattEnhet,
            harFortroligAdresse: false,
            harEgenAnsatt: true,
            identForArbeidsfordeling,
            error: egenAnsattEnhetError ?? error,
        };
    }

    // 3. Returner BM sin enhet, eller yngste barn hvis BM er ukjent
    return {
        enhet: bmEllerBarnEnhet?.nummer ?? null,
        enhetNavn: bmEllerBarnEnhet?.navn ?? null,
        isLoading,
        harFortroligAdresse: false,
        harEgenAnsatt: false,
        identForArbeidsfordeling,
        error,
    };
}
