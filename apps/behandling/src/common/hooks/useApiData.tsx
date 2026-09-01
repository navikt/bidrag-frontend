import { BIDRAG_TILGANGSKONTROLL_API } from "@bidrag/api";
import {
    type AktivereGrunnlagRequestV2,
    type AktivereGrunnlagResponseV2,
    type AndreVoksneIHusstandenGrunnlagDto,
    type ArbeidsforholdGrunnlagDto,
    type BarnDto,
    type BehandlingDtoV2,
    type BeregningValideringsfeil,
    type DelberegningSamvaersklasse,
    type FaktiskTilsynsutgiftDto,
    type GebyrDtoV3,
    type HusstandsmedlemGrunnlagDto,
    type OppdaterBeregnTilDatoRequestDto,
    type OppdatereBegrunnelseRequest,
    type OppdatereBoforholdRequestV2,
    type OppdatereBoforholdResponse,
    type OppdatereInntektBegrunnelseRequest,
    type OppdatereInntektBegrunnelseRespons,
    type OppdatereInntektRequest,
    type OppdatereInntektResponse,
    type OppdaterePrivatAvtaleBegrunnelseRequest,
    type OppdaterePrivatAvtaleRequest,
    type OppdaterePrivatAvtaleResponsDto,
    type OppdatereUnderholdResponse,
    type OppdatereUtgiftRequest,
    type OppdatereUtgiftResponse,
    type OppdatereVirkningstidspunkt,
    type OppdatereVirkningstidspunktBegrunnelseDto,
    type OppdatereVirkningstidspunktBegrunnelseResponseDto,
    type OppdaterGebyrDto,
    type OppdaterManuellVedtakRequest,
    type OppdaterOpphorsdatoRequestDto,
    type OppdaterParagraf35CDetaljerDto,
    type OppdaterSamvaerDto,
    type OppdaterSamvaerResponsDto,
    type OppdaterVirkningstidspunktBegrunnelseBarnResponse,
    type OpplysningerType,
    type OpprettUnderholdskostnadBarnResponse,
    type ResultatBarnebidragsberegningPeriodeDto,
    type RolleDto,
    Rolletype,
    type SamvaerskalkulatorDetaljer,
    type SivilstandAktivGrunnlagDto,
    type SivilstandIkkeAktivGrunnlagDto,
    type SjekkForholdmessigFordelingResponse,
    type SjekkLasterGrunnlagResponse,
    type SletteSamvaersperiodeElementDto,
    type SletteUnderholdselement,
    Stonadstype,
    type StonadTilBarnetilsynAktiveGrunnlagDto,
    type StonadTilBarnetilsynDto,
    type TilleggsstonadDto,
    type VirkningstidspunktBarnDtoV2,
    type VirkningstidspunktFeilV2Dto,
} from "@bidrag/api/BidragBehandlingApiV1";
import type { VedtakNotatDto as NotatPayload } from "@bidrag/api/BidragDokumentProduksjonApi";
import type { VedtakDto } from "@bidrag/api/BidragVedtakApi";
import type { ForelderBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { LoggerService, RolleTypeFullName } from "@bidrag/common";
import { useMutation, useQuery, useQueryClient, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { useFlag } from "@unleash/proxy-client-react";
import { AxiosError } from "axios";
import { useRef } from "react";
import type { OppdatereInntektRequestLosnet, RelaxSpecTypes } from "../../types/apiSpecFix";
import { FantIkkeVedtakEllerBehandlingError } from "../../types/apiStatus";
import type {
    VedtakBarnebidragBeregningResult,
    VedtakBeregningResult,
    VedtakSærbidragBeregningResult,
} from "../../types/vedtakTypes";
import type { Sak } from "../components/sak/sak";
import {
    BEHANDLING_API_V1,
    BIDRAG_DOKUMENT_PRODUKSJON_API,
    ORGANISASJON_API,
    PERSON_API,
    SAK_API,
    VEDTAK_API,
} from "../constants/api";
import { useBehandlingProvider } from "../context/BehandlingContext";
import useFeatureToogle from "./useFeatureToggle";
import { useQueryParams } from "./useQueryParams";

export const MutationKeys = {
    opprettePrivatAvtale: (behandlingId: string) => ["mutation", "createPrivatavtale", behandlingId],
    oppdaterBehandling: (behandlingId: string) => ["mutation", "behandling", behandlingId],
    oppdaterVirkningstidspunktBegrunnelse: (behandlingId: string) => [
        "mutation",
        "virkningstidspunkt",
        "begrunnelse",
        behandlingId,
    ],
    oppdaterManueltOverstyrtGebyr: (behandlingId: string) => [
        "mutation",
        "oppdaterManueltOverstyrtGebyr",
        behandlingId,
    ],
    oppdatereTilsynsordning: (behandlingId: string) => ["mutation", "oppdatereTilsynsordning", behandlingId],
    oppdatereUnderhold: (behandlingId: string) => ["mutation", "oppdatereUnderhold", behandlingId],
    oppretteUnderholdForBarn: (behandlingId: string) => ["mutation", "oppretteUnderholdForBarn", behandlingId],
    updateBoforhold: (behandlingId: string) => ["mutation", "boforhold", behandlingId],
    updateSamvær: (behandlingId: string) => ["mutation", "samvær", behandlingId],
    updateSamværskalkulator: (behandlingId: string) => ["mutation", "updateSamværskalkulator", behandlingId],
    slettSamværskalkulator: (behandlingId: string) => ["mutation", "slettSamværskalkulator", behandlingId],
    beregnSamværsklasse: () => ["mutation", "beregnSamværsklasse"],
    updateInntekter: (behandlingId: string) => ["mutation", "inntekter", behandlingId],
    updateInntekterBegrunnelse: (behandlingId: string) => ["mutation", "inntekterBegrunnelse", behandlingId],
    updateVirkningstidspunkt: (behandlingId: string) => ["mutation", "virkningstidspunkt", behandlingId],
    updateUtgifter: (behandlingId: string) => ["mutation", "utgifter", behandlingId],
    updateStonadTilBarnetilsyn: (behandlingId: string) => ["mutation", "stonadTilBarnetilsyn", behandlingId],
    updateFaktiskeTilsynsutgifter: (behandlingId: string) => ["mutation", "faktiskeTilsynsutgifter", behandlingId],
    updateTilleggstønad: (behandlingId: string) => ["mutation", "tilleggstønad", behandlingId],
    slettUnderholdsElement: (behandlingId: string) => ["mutation", "slettUnderholdsElement", behandlingId],
    oppdaterePrivatAvtale: (behandlingId: string) => ["mutation", "oppdaterePrivatAvtale", behandlingId],
    slettePrivatAvtale: (behandlingId: string) => ["mutation", "slettePrivatAvtale", behandlingId],
};

export const QueryKeys = {
    behandlingVersion: "V1",
    virkningstidspunkt: (behandlingId: string) => ["virkningstidspunkt", QueryKeys.behandlingVersion, behandlingId],
    visningsnavn: () => ["visningsnavn", QueryKeys.behandlingVersion],
    beregningForskudd: () => ["beregning_forskudd", QueryKeys.behandlingVersion],
    beregningSærbidrag: () => ["beregning_særbidrag", QueryKeys.behandlingVersion],
    beregnBarnebidrag: (endelig: boolean) => ["beregning_barnebidrag", QueryKeys.behandlingVersion, endelig],
    beregningInnteksgrenseSærbidrag: () => ["beregning_særbidrag_innteksgrense", QueryKeys.behandlingVersion],
    notat: (behandlingId: string) => ["notat_payload", QueryKeys.behandlingVersion, behandlingId],
    notatPdf: (behandlingId: string) => ["notat_payload_pdf", QueryKeys.behandlingVersion, behandlingId],
    behandlingV2: (behandlingId: string, vedtakId?: string) => [
        "behandlingV2",
        QueryKeys.behandlingVersion,
        behandlingId,
        vedtakId === undefined ? null : vedtakId,
    ],
    sjekkFF: (behandlingId: string) => ["behandlingV2", "FF", QueryKeys.behandlingVersion, behandlingId],
    sjekkTilgangSak: (saksnummer: string) => ["behandlingV2", "tilgangSak", saksnummer],
    hentSakerForIdent: (ident: string, barn: string) => ["saker", ident, barn],
    grunnlag: () => ["grunnlag", QueryKeys.behandlingVersion],
    arbeidsforhold: (behandlingId: string) => ["arbeidsforhold", behandlingId, QueryKeys.behandlingVersion],
    person: (ident: string) => ["person", ident],
    manuelleVedtak: (behandlingId: string) => ["manuelleVedtak", behandlingId],
    sjekkLasterGrunnlag: (behandlingId: string) => ["sjekkLasterGrunnlag", behandlingId],
};

export interface BaseMutationVariables {
    triggeredBy?: string;
    [key: string]: unknown;
}

export const useRefetchOnlyFFInfoFn = () => {
    const { id } = useGetBehandlingV2();
    const client = useQueryClient();
    const { tilgangOppretteFF } = useFeatureToogle();
    return () => {
        if (tilgangOppretteFF) {
            client.refetchQueries({ queryKey: QueryKeys.sjekkFF(id.toString()) });
        }
    };
};

export const useRefetchFFInfoFn = (reloadWindow?: boolean) => {
    const { id } = useGetBehandlingV2();
    const client = useQueryClient();
    const { tilgangOppretteFF } = useFeatureToogle();
    return () => {
        if (tilgangOppretteFF) {
            client.refetchQueries({ queryKey: QueryKeys.behandlingV2(id.toString()) });
            client.refetchQueries({ queryKey: QueryKeys.sjekkFF(id.toString()) });
            if (reloadWindow === true) {
                // Reset queries fører til rar oppførsel i noen tilfeller (form status oppdateres ikke, må gå fram og tilbake mellom bilder), så derfor velger vi å reloade siden
                window.location.reload();
            }
        }
    };
};

export const useRegistrerBarnTilSak = (saksnummer: string, gjelderBarnIdent: string, onSuccess?: () => void) => {
    const refetchFFInfo = useRefetchFFInfoFn();
    return useMutation({
        mutationFn: async () => {
            if (!saksnummer) {
                throw new Error("Du må velge en sak før du kan legge den til");
            }
            try {
                const oppdatertSak = SAK_API.sak.oppdaterSak({
                    saksnummer: saksnummer,
                    roller: [
                        {
                            rolleType: Rolletype.BA,
                            type: Rolletype.BA,
                            foedselsnummer: gjelderBarnIdent,
                            mottagerErVerge: false,
                            rollehistorikk: [],
                        },
                    ],
                });
                console.log("oppdatertSak med roller", oppdatertSak);
            } catch (e) {
                LoggerService.error("Feil ved oppdatering av sak", e);
            }
        },
        onSuccess: () => {
            onSuccess?.();
            refetchFFInfo();
        },
    });
};
export const useGetArbeidsforhold = (): ArbeidsforholdGrunnlagDto[] => {
    const behandling = useGetBehandlingV2();
    return behandling.aktiveGrunnlagsdata?.arbeidsforhold;
};
export const useGetOpplysningerBoforhold = (): {
    aktiveOpplysninger: HusstandsmedlemGrunnlagDto[];
    ikkeAktiverteOpplysninger: HusstandsmedlemGrunnlagDto[];
} => {
    const behandling = useGetBehandlingV2();
    return {
        aktiveOpplysninger: behandling.aktiveGrunnlagsdata?.husstandsmedlem,
        ikkeAktiverteOpplysninger: behandling.ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem,
    };
};

export const useGetOpplysningerBarnetilsyn = (): {
    aktiveOpplysninger: StonadTilBarnetilsynAktiveGrunnlagDto;
    ikkeAktiverteOpplysninger: StonadTilBarnetilsynAktiveGrunnlagDto;
} => {
    const behandling = useGetBehandlingV2();
    return {
        aktiveOpplysninger: behandling.aktiveGrunnlagsdata?.stønadTilBarnetilsyn,
        ikkeAktiverteOpplysninger: behandling.ikkeAktiverteEndringerIGrunnlagsdata?.stønadTilBarnetilsyn,
    };
};

export const useGetOpplysningeAndreVoksneIHusstand = (): {
    aktiveOpplysninger: AndreVoksneIHusstandenGrunnlagDto;
    ikkeAktiverteOpplysninger: AndreVoksneIHusstandenGrunnlagDto;
} => {
    const behandling = useGetBehandlingV2();
    return {
        aktiveOpplysninger: behandling.aktiveGrunnlagsdata?.andreVoksneIHusstanden,
        ikkeAktiverteOpplysninger: behandling.ikkeAktiverteEndringerIGrunnlagsdata?.andreVoksneIHusstanden,
    };
};
export const useGetOpplysningerSivilstandV2 = (): {
    aktiveOpplysninger: SivilstandAktivGrunnlagDto;
    ikkeAktiverteOpplysninger: SivilstandIkkeAktivGrunnlagDto;
} => {
    const behandling = useGetBehandlingV2();
    return {
        aktiveOpplysninger: behandling.aktiveGrunnlagsdata?.sivilstand,
        ikkeAktiverteOpplysninger: behandling.ikkeAktiverteEndringerIGrunnlagsdata?.sivilstand,
    };
};
export const useGetOpplysningerSivilstand = (): SivilstandAktivGrunnlagDto => {
    const behandling = useGetBehandlingV2();
    return behandling.aktiveGrunnlagsdata?.sivilstand;
};

export const useHentVedtak = (vedtakId?: number) => {
    return useQuery({
        queryKey: ["vedtak", vedtakId],
        queryFn: async (): Promise<VedtakDto> => {
            try {
                if (!vedtakId) return {} as VedtakDto;
                const { data } = await VEDTAK_API.vedtak.hentVedtak(vedtakId);
                return data;
            } catch (error) {
                LoggerService.error("Feil ved henting av vedtak", error);
                return {} as VedtakDto;
            }
        },
        networkMode: "always",
    });
};
export const useUpdateInntekt = () => {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    const refetchFF = useRefetchOnlyFFInfoFn();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.updateInntekter(behandlingId),
        mutationFn: async (payload: OppdatereInntektRequestLosnet): Promise<OppdatereInntektResponse> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereInntekt(
                Number(behandlingId),
                payload as OppdatereInntektRequest,
            );
            return data;
        },
        onSuccess: (response) => {
            refetchFF();
            queryClient.setQueryData(QueryKeys.behandlingV2(behandlingId, vedtakId), (currentData: BehandlingDtoV2) => {
                return {
                    ...currentData,
                    gebyrV3: response.gebyrV3,
                    inntekterV2: response.inntekterV2.map((inntekt) => {
                        const currentInntekt = currentData.inntekterV2.find((i) => i.gjelder.id === inntekt.gjelder.id);
                        return {
                            ...inntekt,
                            inntekter: {
                                ...inntekt.inntekter,
                                begrunnelse: currentInntekt.inntekter.begrunnelse,
                            },
                        };
                    }),
                };
            });
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av inntekter", error);
        },
    });
};

export const useUpdateInntektBegrunnelse = () => {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.updateInntekterBegrunnelse(behandlingId),
        mutationFn: async (
            payload: OppdatereInntektBegrunnelseRequest,
        ): Promise<OppdatereInntektBegrunnelseRespons> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereInntektBegrunnelse(Number(behandlingId), payload);
            return data;
        },
        onSuccess: (response, payload) => {
            queryClient.setQueryData(QueryKeys.behandlingV2(behandlingId, vedtakId), (currentData: BehandlingDtoV2) => {
                return {
                    ...currentData,
                    inntekterV2: currentData.inntekterV2.map((inntekt) => {
                        if (inntekt.gjelder.id === payload.oppdatereBegrunnelse.rolleid) {
                            return {
                                ...inntekt,
                                inntekter: {
                                    ...inntekt.inntekter,
                                    begrunnelse: {
                                        ...inntekt.inntekter.begrunnelse,
                                        innhold: response.oppdatertBegrunnelse.nyBegrunnelse,
                                        kunINotat: response.oppdatertBegrunnelse.nyBegrunnelse,
                                    },
                                },
                            };
                        }
                        return inntekt;
                    }),
                };
            });
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av inntekt begrunnelse", error);
        },
    });
};

export const useDeleteSamværsperiode = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.updateSamvær(behandlingId),
        mutationFn: async (payload: SletteSamvaersperiodeElementDto): Promise<OppdaterSamvaerResponsDto> => {
            const { data } = await BEHANDLING_API_V1.api.slettSamvaersperiode(Number(behandlingId), payload);
            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        samværV2: {
                            erSammeForAlle: response.erSammeForAlle,
                            barn: response.samværBarn.map((barn) => {
                                const currentBegrunnelse = currentData.samværV2.barn.find(
                                    (b) => b.id === barn.id,
                                )?.begrunnelse;
                                return {
                                    ...barn,
                                    begrunnelse: currentBegrunnelse,
                                };
                            }),
                        },
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved sletting av samværsperiode", error);
        },
    });
};

export const useBeregnSamværsklasse = () => {
    return useMutation({
        mutationKey: MutationKeys.beregnSamværsklasse(),
        mutationFn: async (payload: SamvaerskalkulatorDetaljer): Promise<DelberegningSamvaersklasse> => {
            const { data } = await BEHANDLING_API_V1.api.beregnSamvaersklasse(payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av boforhold", error);
        },
    });
};

interface OppdaterSamvaerPayload extends BaseMutationVariables, OppdaterSamvaerDto {}

export const useUpdateSamvær = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.updateSamvær(behandlingId),
        mutationFn: async (input: OppdaterSamvaerPayload): Promise<OppdaterSamvaerResponsDto> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            const { data } = await BEHANDLING_API_V1.api.oppdaterSamvaer(Number(behandlingId), payload);
            return data;
        },
        onSuccess: (response, input) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        samværV2: {
                            erSammeForAlle: response.erSammeForAlle,
                            barn: response.samværBarn.map((barn) => {
                                if (input.triggeredBy.includes("begrunnelse")) {
                                    const currentBarn = currentData.samværV2.barn.find((b) => b.id === barn.id);
                                    return {
                                        ...currentBarn,
                                        valideringsfeil: barn.valideringsfeil,
                                        begrunnelse: barn.begrunnelse,
                                    };
                                }
                                const currentBegrunnelse = currentData.samværV2.barn.find(
                                    (b) => b.id === barn.id,
                                )?.begrunnelse;
                                return {
                                    ...barn,
                                    begrunnelse: currentBegrunnelse,
                                };
                            }),
                        },
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av samvær", error);
        },
    });
};

type OppdaterBoforholdPayload = BaseMutationVariables & RelaxSpecTypes<OppdatereBoforholdRequestV2>;

export const useUpdateBoforhold = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.updateBoforhold(behandlingId),
        mutationFn: async (input: OppdaterBoforholdPayload): Promise<OppdatereBoforholdResponse> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            const { data } = await BEHANDLING_API_V1.api.oppdatereBoforhold(
                Number(behandlingId),
                payload as OppdatereBoforholdRequestV2,
            );
            return data;
        },
        onSuccess: (response, payload) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    let husstandsmedlem = currentData.boforhold.husstandsmedlem;
                    let sivilstand = currentData.boforhold.sivilstand;
                    let andreVoksneIHusstanden = currentData.boforhold.andreVoksneIHusstanden;
                    let begrunnelse = currentData.boforhold.begrunnelse;
                    let valideringsfeil = currentData.boforhold.valideringsfeil;
                    let egetBarnErEnesteVoksenIHusstanden = currentData.boforhold.egetBarnErEnesteVoksenIHusstanden;
                    let beregnetBoforhold = currentData.boforhold.beregnetBoforhold;

                    if (payload.triggeredBy === "begrunnelse") {
                        begrunnelse = {
                            innhold: response.begrunnelse,
                            kunINotat: response.begrunnelse,
                        };
                    }

                    if (payload.triggeredBy !== "begrunnelse") {
                        valideringsfeil = response.valideringsfeil;
                        egetBarnErEnesteVoksenIHusstanden = response.egetBarnErEnesteVoksenIHusstanden;
                        beregnetBoforhold = response.beregnetBoforhold;
                    }

                    if (payload.triggeredBy === "periodeUpdate") {
                        const updatedHusstandsmedlemIndex = currentData.boforhold.husstandsmedlem.findIndex(
                            (h) => h.id === response.oppdatertHusstandsmedlem.id,
                        );

                        husstandsmedlem =
                            updatedHusstandsmedlemIndex === -1
                                ? currentData.boforhold.husstandsmedlem.concat(response.oppdatertHusstandsmedlem)
                                : currentData.boforhold.husstandsmedlem.toSpliced(
                                      updatedHusstandsmedlemIndex,
                                      1,
                                      response.oppdatertHusstandsmedlem,
                                  );
                    }

                    if (payload.triggeredBy === "addBarn") {
                        husstandsmedlem = currentData.boforhold.husstandsmedlem.concat(
                            response.oppdatertHusstandsmedlem,
                        );
                    }

                    if (payload.triggeredBy === "removeBarn") {
                        husstandsmedlem = currentData.boforhold.husstandsmedlem.filter(
                            (b) => b.id !== payload.oppdatereHusstandsmedlem.slettHusstandsmedlem,
                        );
                    }

                    if (payload.triggeredBy === "sivilstand") {
                        sivilstand = response.oppdatertSivilstandshistorikk?.toSorted((a, b) =>
                            a.datoFom > b.datoFom ? 1 : -1,
                        );
                    }

                    if (payload.triggeredBy === "andreVoksneIHusstanden") {
                        andreVoksneIHusstanden = response.oppdatertePerioderMedAndreVoksne;
                    }

                    return {
                        ...currentData,
                        boforhold: {
                            ...currentData.boforhold,
                            husstandsmedlem,
                            begrunnelse,
                            andreVoksneIHusstanden,
                            sivilstand,
                            valideringsfeil,
                            egetBarnErEnesteVoksenIHusstanden,
                            beregnetBoforhold,
                        },
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av boforhold", error);
        },
    });
};

const hentOrganisasjonDetaljer = async (enhetsnummer: string): Promise<string> => {
    try {
        const enhetInfo = await ORGANISASJON_API.enhet.hentEnhetInfo(enhetsnummer);
        return enhetInfo.data.navn;
    } catch (e) {
        console.error("Feil ved henting av organisasjonsdetaljer for enhet:", enhetsnummer, e);
        return "Ukjent enhet";
    }
};

const hentPersonDetaljer = async (ident: string): Promise<PersonDto> => {
    try {
        return (await PERSON_API.informasjon.hentPersonPost({ ident })).data;
    } catch (e) {
        console.error("Feil ved henting av persondetaljer for ident:", ident, e);
        return { navn: "Ukjent person", ident, visningsnavn: "Ukjent person" };
    }
};
export const useGetSakerForBp = (gjelderBarnIdent: string): Sak[] => {
    const { roller } = useGetBehandlingV2();
    const foreldre = useHentPersonForeldre(gjelderBarnIdent);
    const bpIdent = roller.find((r) => r.rolletype === Rolletype.BP)?.ident;
    const motsattRolle = foreldre.data.find(
        (relasjon) => relasjon.relatertPersonsIdent !== bpIdent,
    )?.relatertPersonsIdent;
    const { data: response } = useSuspenseQuery<Sak[]>({
        queryKey: QueryKeys.hentSakerForIdent(bpIdent, gjelderBarnIdent),
        queryFn: async () => {
            try {
                const saker = (await SAK_API.person.finnForFodselsnummer(JSON.stringify(bpIdent))).data;

                return await Promise.all(
                    saker
                        .filter(
                            (sak) => sak.roller.find((rolle) => rolle.fodselsnummer === bpIdent)?.type === Rolletype.BP,
                        )
                        .filter((sak) => {
                            return (
                                motsattRolle === undefined ||
                                sak.roller.some((rolle) => rolle.fodselsnummer === motsattRolle)
                            );
                        })
                        .map(async (sak) => {
                            const enhetInfo = await hentOrganisasjonDetaljer(sak.eierfogd);
                            const bpRolle = sak.roller.find((rolle) => rolle.fodselsnummer === bpIdent);
                            const motsattRolle = sak.roller
                                .filter((r) => ![Rolletype.BA, Rolletype.FR, Rolletype.RM].includes(r.type))
                                .find((rolle) => rolle.fodselsnummer !== bpIdent);
                            const motsattRolleInfo = await hentPersonDetaljer(motsattRolle.fodselsnummer);
                            return {
                                ...sak,
                                ferdigRegistrert: sak.roller.length > 1,
                                enhetInformasjon: enhetInfo,
                                motsattRolle: { ...motsattRolle, navn: motsattRolleInfo?.visningsnavn },
                                rolle: bpRolle,
                                roller: sak.roller.map((rolle) => ({ ...rolle, ident: bpIdent })),
                            };
                        }),
                );
            } catch (e) {
                console.log(e);
                return [] as Sak[];
            }
        },
        staleTime: Infinity,
    });
    return response;
};
export const useUthevPerson = (ident: string, stønad18År: boolean): boolean => {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    const soknadId = useQueryParams().get("soknadId");
    const roller = useBehandlingV2(behandlingId, vedtakId).roller;

    if (!soknadId) {
        return false;
    }
    const alleRollerSammeSøknad = roller.every((rolle) =>
        rolle.søknader?.flatMap((s) => s.søknadsId).some((søknad) => Number(soknadId) === søknad),
    );
    if (alleRollerSammeSøknad) {
        return false;
    }
    return roller.some(
        (rolle) =>
            rolle.ident === ident &&
            (rolle.rolletype !== Rolletype.BA ||
                rolle.stønadstype === (stønad18År ? Stonadstype.BIDRAG18AAR : Stonadstype.BIDRAG)) &&
            rolle.søknader?.flatMap((s) => s.søknadsId).some((søknad) => Number(soknadId) === søknad),
    );
};

export const useHentRevurderingsbarn = (ident: string, stønad18År: boolean): boolean => {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    return useBehandlingV2(behandlingId, vedtakId).roller.some(
        (rolle) =>
            rolle.erRevurdering &&
            rolle.ident === ident &&
            rolle.stønadstype === (stønad18År ? Stonadstype.BIDRAG18AAR : Stonadstype.BIDRAG),
    );
};
export const useHarTilgangSak = (saksnummer: string): boolean => {
    const { data: response } = useSuspenseQuery({
        queryKey: QueryKeys.sjekkTilgangSak(saksnummer),
        queryFn: async () => {
            try {
                const response = await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangSakV2({ saksnummer });
                return response.data.harTilgang;
            } catch (e) {
                console.log(e);
                return false;
            }
        },
        staleTime: Infinity,
    });
    return response;
};
export const useGetBehandlingV2 = (): BehandlingDtoV2 => {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    return useBehandlingV2(behandlingId, vedtakId);
};

export const useGetForholdsmessigFordelingDetaljer = (): SjekkForholdmessigFordelingResponse => {
    const { behandlingId, enhet } = useBehandlingProvider();
    const bidragFlereBarn = useFlag("behandling.behandle_bidrag_flere_barn");
    const { løpendeBidragBarn } = useGetBehandlingV2();
    const { data: response } = useSuspenseQuery({
        queryKey: QueryKeys.sjekkFF(behandlingId),
        queryFn: async () => {
            try {
                if (!behandlingId || !bidragFlereBarn) {
                    return {
                        kanOppretteForholdsmessigFordeling: false,
                        løpendeBidragBarn,
                    } as SjekkForholdmessigFordelingResponse;
                }
                return (
                    await BEHANDLING_API_V1.api.kanOppretteForholdsmessigFordeling(Number(behandlingId), {
                        opprettetAvEnhet: enhet,
                        detaljerBarn: [],
                    })
                ).data;
            } catch (e) {
                console.log(e);
                return { kanOppretteForholdsmessigFordeling: false } as SjekkForholdmessigFordelingResponse;
            }
        },
        staleTime: Infinity,
    });
    return response;
};
export const useBehandlingV2 = (behandlingId?: string, vedtakId?: string): BehandlingDtoV2 => {
    const queryClient = useQueryClient();
    const { data: behandling } = useSuspenseQuery({
        queryKey: QueryKeys.behandlingV2(behandlingId, vedtakId),
        queryFn: async () => {
            try {
                const qs = queryClient.getQueryState(QueryKeys.behandlingV2(behandlingId, vedtakId));

                if (vedtakId) {
                    return (await BEHANDLING_API_V1.api.vedtakLesemodus(Number(vedtakId))).data;
                }
                return (
                    await BEHANDLING_API_V1.api.henteBehandlingV2(Number(behandlingId), {
                        ikkeHentGrunnlag: qs.dataUpdateCount > 0,
                    })
                ).data;
            } catch (e) {
                if (e instanceof AxiosError && e.response.status === 404) {
                    throw new FantIkkeVedtakEllerBehandlingError(
                        `Fant ikke ${vedtakId ? "vedtak" : "behandling"} med id ${vedtakId ?? behandlingId}`,
                    );
                }
                throw e;
            }
        },
        retry: (count, error) => {
            if (error instanceof FantIkkeVedtakEllerBehandlingError) {
                return false;
            }
            return count < 3;
        },
        staleTime: Infinity,
    });
    return behandling;
};
export const useHentPersonForeldre = (ident?: string) =>
    useSuspenseQuery({
        queryKey: ["persons", "foreldre", ident],
        queryFn: async (): Promise<ForelderBarnRelasjon[]> => {
            if (!ident) return [];
            const { data } = await PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident: ident });
            return data.forelderBarnRelasjon
                .filter((b) => b.minRolleForPerson === "BARN")
                .filter(
                    (relasjon) => relasjon.relatertPersonsRolle === "FAR" || relasjon.relatertPersonsRolle === "MOR",
                );
        },
        staleTime: Infinity,
    });
export const useHentPersonData = (ident?: string) =>
    useSuspenseQuery({
        queryKey: ["persons", ident],
        queryFn: async (): Promise<PersonDto> => {
            if (!ident) return { ident: "", visningsnavn: "Ukjent" };
            try {
                const { data } = await PERSON_API.informasjon.hentPersonPost({ ident: ident });
                return data;
            } catch (_e) {
                return { ident: "", visningsnavn: "Ingen tilgang", diskresjonskode: "SPSF" };
            }
        },
        staleTime: Infinity,
    });

export const usePersonsQueries = (roller: RolleDto[]) =>
    useSuspenseQueries({
        queries: roller.map((rolle) => ({
            queryKey: QueryKeys.person(rolle.ident + rolle.stønadstype),
            queryFn: async (): Promise<
                PersonDto & { rolleType: RolleTypeFullName; stønadstype?: Stonadstype; saksnummer: string }
            > => {
                if (!rolle.ident)
                    return {
                        ident: "",
                        visningsnavn: rolle.navn,
                        rolleType: RolleTypeFullName.FEILREGISTRERT,
                        saksnummer: "",
                    };
                const { data } = await PERSON_API.informasjon.hentPersonPost({ ident: rolle.ident });
                return {
                    ...rolle,
                    ident: rolle.ident!,
                    stønadstype: rolle.stønadstype,
                    rolleType: rolle.rolletype as unknown as RolleTypeFullName,
                    navn: data.navn,
                    kortnavn: data.kortnavn,
                    visningsnavn: data.visningsnavn,
                };
            },
        })),
    });

export const useNotatPdf = (behandlingId?: string, vedtakId?: string) => {
    const resultPayload = useQuery({
        queryKey: QueryKeys.notatPdf(behandlingId ?? vedtakId),
        queryFn: async () => {
            if (vedtakId) {
                return (await BEHANDLING_API_V1.api.hentNotatOpplysningerForVedtak(Number(vedtakId))).data;
            }
            return (await BEHANDLING_API_V1.api.hentNotatOpplysninger(Number(behandlingId))).data;
        },
        refetchOnWindowFocus: false,
        refetchInterval: 0,
    });

    const resultNotatPdf = useQuery({
        queryKey: ["notat_pdf", behandlingId, resultPayload.data],
        queryFn: () =>
            BIDRAG_DOKUMENT_PRODUKSJON_API.api.generatePdf(
                //@ts-expect-error
                resultPayload.data as NotatPayload,
                {
                    format: "blob",
                },
            ),
        select: (response) => response.data,
        enabled: resultPayload.isFetched,
        refetchOnWindowFocus: false,
        refetchInterval: 0,
        staleTime: Infinity,
        placeholderData: (previousData) => previousData,
    });

    return resultPayload.isError || resultPayload.isLoading ? resultPayload : resultNotatPdf;
};

export const useNotat = (behandlingId?: string, vedtakId?: string) => {
    const resultPayload = useQuery({
        queryKey: QueryKeys.notat(behandlingId ?? vedtakId),
        queryFn: async () => {
            if (vedtakId) {
                return (await BEHANDLING_API_V1.api.hentNotatOpplysningerForVedtak(Number(vedtakId))).data;
            }
            return (await BEHANDLING_API_V1.api.hentNotatOpplysninger(Number(behandlingId))).data;
        },
        refetchOnWindowFocus: false,
        refetchInterval: 0,
    });

    const resultNotatHtml = useQuery({
        queryKey: ["notat_html", behandlingId, resultPayload.data],
        queryFn: () =>
            BIDRAG_DOKUMENT_PRODUKSJON_API.api.generateHtml(
                //@ts-expect-error
                resultPayload.data as NotatPayload,
            ),
        select: (response) => response.data,
        enabled: resultPayload.isFetched,
        refetchOnWindowFocus: false,
        refetchInterval: 0,
        staleTime: Infinity,
        placeholderData: (previousData) => previousData,
    });

    return resultPayload.isError || resultPayload.isLoading ? resultPayload : resultNotatHtml;
};
export const useAktiveGrunnlagsdata = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation<
        { data: AktivereGrunnlagResponseV2; type: OpplysningerType },
        { data: AktivereGrunnlagResponseV2; type: OpplysningerType },
        { personident: string; gjelderIdent?: string; type: OpplysningerType }
    >({
        mutationFn: async ({ personident, gjelderIdent, type }) => {
            const { data } = await BEHANDLING_API_V1.api.aktivereGrunnlag(Number(behandlingId), {
                personident,
                gjelderIdent,
                grunnlagstype: type,
                overskriveManuelleOpplysninger: true,
            });
            return { data, type };
        },
        onSuccess: ({ data }) => {
            queryClient.setQueryData<BehandlingDtoV2>(QueryKeys.behandlingV2(behandlingId), (currentData) => {
                const updatedBehandling = {
                    ...currentData,
                    inntekterV2: data.inntekterV2,
                    ikkeAktiverteEndringerIGrunnlagsdata: data.ikkeAktiverteEndringerIGrunnlagsdata,
                    aktiveGrunnlagsdata: data.aktiveGrunnlagsdata,
                };
                return updatedBehandling;
            });
        },
    });
};
export const useGetBeregningInnteksgrenseSærbidrag = () => {
    const { behandlingId, vedtakId } = useBehandlingProvider();

    return useSuspenseQuery<number>({
        queryKey: QueryKeys.beregningInnteksgrenseSærbidrag(),
        queryFn: async () => {
            try {
                if (vedtakId) {
                    return -1;
                }
                const response = await BEHANDLING_API_V1.api.beregnBPsLavesteInntektForEvne(Number(behandlingId));
                return response.data;
            } catch (error) {
                console.error("error", error);
                return -1;
            }
        },
    });
};
export const useGetBeregningBidrag = (endelig: boolean) => {
    const { behandlingId, vedtakId } = useBehandlingProvider();

    return useSuspenseQuery<VedtakBarnebidragBeregningResult>({
        queryKey: QueryKeys.beregnBarnebidrag(endelig),
        queryFn: async () => {
            try {
                if (vedtakId) {
                    const response = await BEHANDLING_API_V1.api.hentVedtakBeregningResultatBidrag(Number(vedtakId));
                    return { resultat: response.data };
                }
                const response = await BEHANDLING_API_V1.api.beregnBarnebidrag(Number(behandlingId), {
                    endeligBeregning: endelig,
                });
                const ugyldigBeregning =
                    response.data.ugyldigBeregning != null ||
                    response.data.resultatBarn.some((barn) => barn.ugyldigBeregning);
                return { resultat: response.data, ugyldigBeregning: ugyldigBeregning };
            } catch (error) {
                console.log("error beregnBarnebidrag", error);
                const feilmelding = error.response.headers.warning?.split(",") ?? [];
                if (error instanceof AxiosError && error.response.status === 400) {
                    if (error.response?.data) {
                        return {
                            feil: {
                                melding: feilmelding,
                                detaljer: error.response.data as BeregningValideringsfeil,
                            },
                        };
                    }
                    return {
                        feil: {
                            melding: feilmelding,
                        },
                    };
                }
            }
        },
    });
};
export const useGetBeregningSærbidrag = () => {
    const { behandlingId, vedtakId } = useBehandlingProvider();

    return useSuspenseQuery<VedtakSærbidragBeregningResult>({
        queryKey: QueryKeys.beregningSærbidrag(),
        queryFn: async () => {
            try {
                if (vedtakId) {
                    const response = await BEHANDLING_API_V1.api.hentVedtakBeregningResultatSaerbidrag(
                        Number(vedtakId),
                    );
                    return { resultat: response.data };
                }
                const response = await BEHANDLING_API_V1.api.beregnSaerbidrag(Number(behandlingId));
                return { resultat: response.data };
            } catch (error) {
                const feilmelding = error.response.headers.warning?.split(",") ?? [];
                if (error instanceof AxiosError && error.response.status === 400) {
                    if (error.response?.data) {
                        return {
                            feil: {
                                melding: feilmelding,
                                detaljer: error.response.data as BeregningValideringsfeil,
                            },
                        };
                    }
                    return {
                        feil: {
                            melding: feilmelding,
                        },
                    };
                }
            }
        },
    });
};
export const useGetBeregningForskudd = () => {
    const { behandlingId, vedtakId } = useBehandlingProvider();

    return useSuspenseQuery<VedtakBeregningResult>({
        queryKey: QueryKeys.beregningForskudd(),
        queryFn: async () => {
            try {
                if (vedtakId) {
                    const response = await BEHANDLING_API_V1.api.hentVedtakBeregningResultat(Number(vedtakId));
                    return { resultat: response.data };
                }
                const response = await BEHANDLING_API_V1.api.beregnForskudd1(Number(behandlingId));
                return { resultat: response.data };
            } catch (error) {
                const feilmelding = error.response.headers.warning?.split(",") ?? [];
                if (error instanceof AxiosError && error.response.status === 400) {
                    if (error.response?.data) {
                        return {
                            feil: {
                                melding: feilmelding,
                                detaljer: error.response.data as BeregningValideringsfeil,
                            },
                        };
                    }
                    return {
                        feil: {
                            melding: feilmelding,
                        },
                    };
                }
            }
        },
    });
};

export const useAktiverGrunnlagsdata = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.updateBoforhold(behandlingId),
        mutationFn: async (payload: AktivereGrunnlagRequestV2): Promise<AktivereGrunnlagResponseV2> => {
            const { data } = await BEHANDLING_API_V1.api.aktivereGrunnlag(Number(behandlingId), payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av grunnlag", error);
        },
    });
};

export const useOppdatereVirkningstidspunktV2 = () => {
    const { behandlingId, setMutating } = useBehandlingProvider();
    const behandling = useGetBehandlingV2();
    const abortControllerRef = useRef<AbortController | null>(null);
    const activeRequestIdRef = useRef<number>(0);

    return useMutation({
        mutationKey: MutationKeys.updateVirkningstidspunkt(behandlingId),
        mutationFn: async (payload: OppdatereVirkningstidspunkt): Promise<BehandlingDtoV2> => {
            setMutating(true);
            // Abort any previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller and assign unique request ID
            abortControllerRef.current = new AbortController();
            const currentRequestId = ++activeRequestIdRef.current;

            try {
                const { data } = await BEHANDLING_API_V1.api.oppdatereVirkningstidspunktV2(
                    Number(behandlingId),
                    payload,
                    { signal: abortControllerRef.current.signal },
                );
                setMutating(false);

                // Only process if this is still the active request
                if (currentRequestId === activeRequestIdRef.current) {
                    return data;
                }

                // Request was superseded, return last successful response
                return behandling;
            } catch (error) {
                const isCancelledRequest = error.code === "ERR_CANCELED" || error.name === "CanceledError";

                // If request was cancelled and superseded by another request
                if (isCancelledRequest && currentRequestId !== activeRequestIdRef.current) {
                    return behandling;
                }

                // Real error, throw it
                throw error;
            }
        },
        networkMode: "always",

        onError: (error) => {
            setMutating(false);
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av virkningstidsdpunkt", error);
        },
    });
};

interface VirkningstidspunktBegrunnelsePayload
    extends BaseMutationVariables,
        OppdatereVirkningstidspunktBegrunnelseDto {}
export const useOppdatereVirkningstidspunktBegrunnelse = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    const updateBarnWithResponse = (
        barn: VirkningstidspunktBarnDtoV2,
        response: OppdaterVirkningstidspunktBegrunnelseBarnResponse,
        valideringsfeil?: VirkningstidspunktFeilV2Dto,
    ): VirkningstidspunktBarnDtoV2 => {
        return {
            ...barn,
            valideringsfeilV2: valideringsfeil ?? barn.valideringsfeilV2,
            begrunnelse: {
                ...barn.begrunnelse,
                innhold: response.oppdatertBegrunnelse,
            },
            begrunnelseVurderingAvSkolegang: {
                ...barn.begrunnelseVurderingAvSkolegang,
                innhold: response.oppdatertBegrunnelseVurderingAvSkolegang,
            },
        };
    };

    return useMutation({
        mutationKey: MutationKeys.oppdaterVirkningstidspunktBegrunnelse(behandlingId),
        mutationFn: async (
            input: VirkningstidspunktBegrunnelsePayload,
        ): Promise<OppdatereVirkningstidspunktBegrunnelseResponseDto> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            const { data } = await BEHANDLING_API_V1.api.oppdatereVirkningstidspunktV2Begrunnelse(
                Number(behandlingId),
                payload,
            );
            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        virkningstidspunktV3: {
                            ...currentData.virkningstidspunktV3,
                            erLikForAlle: response.erLikForAlle,
                            barn: currentData.virkningstidspunktV3.barn.map((barn) => {
                                const responseBarn = response.barn.find((b) => b.rolleId === barn.rolle.id);
                                const validerignsfeil = response.valideringsfeil?.find(
                                    (b) => b.gjelder.id === barn.rolle.id,
                                );
                                return responseBarn
                                    ? updateBarnWithResponse(barn, responseBarn, validerignsfeil)
                                    : barn;
                            }),
                        },
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av virkningstidsdpunkt begrunnelse", error);
        },
    });
};

export interface UtgifterPayload extends BaseMutationVariables, OppdatereUtgiftRequest {}

export const useUpdateUtgifter = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.updateUtgifter(behandlingId),
        mutationFn: async (input: UtgifterPayload): Promise<OppdatereUtgiftResponse> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            const { data } = await BEHANDLING_API_V1.api.oppdatereUtgift(Number(behandlingId), payload);
            return data;
        },
        onSuccess: (response, input) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        utgift: {
                            ...currentData.utgift,
                            avslag: response.avslag,
                            beregning: response.beregning,
                            utgifter: response.utgiftposter,
                            valideringsfeil: response.valideringsfeil,
                            totalBeregning: response.totalBeregning,
                            maksGodkjentBeløp: response.maksGodkjentBeløp,
                            begrunnelse:
                                input.triggeredBy === "begrunnelse"
                                    ? { innhold: response.begrunnelse, kunINotat: response.begrunnelse }
                                    : currentData.utgift.begrunnelse,
                        },
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av utgifter", error);
        },
    });
};

export const useUpdateStønadTilBarnetilsyn = (underholdsid: string) => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.updateStonadTilBarnetilsyn(behandlingId),
        mutationFn: async (payload: StonadTilBarnetilsynDto): Promise<OppdatereUnderholdResponse> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereStonadTilBarnetilsyn(
                Number(behandlingId),
                Number(underholdsid),
                payload,
            );
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av stønad til barnetilsyn", error);
        },
    });
};

export const useDeleteUnderholdsObjekt = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.slettUnderholdsElement(behandlingId),
        mutationFn: async (payload: SletteUnderholdselement): Promise<OppdatereUnderholdResponse> => {
            const { data } = await BEHANDLING_API_V1.api.sletteFraUnderhold(Number(behandlingId), payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved sletting av underhold", error);
        },
    });
};

export const useUpdateFaktiskeTilsynsutgifter = (underholdsid: number) => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.updateFaktiskeTilsynsutgifter(behandlingId),
        mutationFn: async (payload: FaktiskTilsynsutgiftDto): Promise<OppdatereUnderholdResponse> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereFaktiskTilsynsutgift(
                Number(behandlingId),
                underholdsid,
                payload,
            );
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av faktiske tilsynsutgifter", error);
        },
    });
};

export const useUpdateTilleggstønad = (underholdsid: number) => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.updateTilleggstønad(behandlingId),
        mutationFn: async (payload: TilleggsstonadDto): Promise<OppdatereUnderholdResponse> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereTilleggsstonad(
                Number(behandlingId),
                underholdsid,
                payload,
            );
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av tillegstønad", error);
        },
    });
};

export const useCreateUnderholdForBarn = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.oppretteUnderholdForBarn(behandlingId),
        mutationFn: async (payload: BarnDto): Promise<OpprettUnderholdskostnadBarnResponse> => {
            const { data } = await BEHANDLING_API_V1.api.oppretteUnderholdForBarn(Number(behandlingId), payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppretting av underholds barn", error);
        },
    });
};

interface UnderholdskostnadBegrunnelsePayload extends BaseMutationVariables, OppdatereBegrunnelseRequest {}

export const useUpdateUnderholdBegrunnelse = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdatereUnderhold(behandlingId),
        mutationFn: async (input: UnderholdskostnadBegrunnelsePayload): Promise<void> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            await BEHANDLING_API_V1.api.oppdatereBegrunnelse(Number(behandlingId), payload);
        },
        onSuccess: (_, payload) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    const updatedAndreBarn = payload.triggeredBy.startsWith("underholdskostnaderAndreBarn");
                    const underholdIndex = currentData.underholdskostnader.findIndex(
                        (underhold) => underhold.id === Number(payload.underholdsid),
                    );

                    const updatedUnderholdskostnader = updatedAndreBarn
                        ? currentData.underholdskostnader.map((underhold) => ({
                              ...underhold,
                              begrunnelse: underhold.gjelderBarn.medIBehandlingen
                                  ? underhold.begrunnelse
                                  : payload.begrunnelse,
                          }))
                        : currentData.underholdskostnader.toSpliced(Number(underholdIndex), 1, {
                              ...currentData.underholdskostnader[underholdIndex],
                              begrunnelse: payload.begrunnelse,
                          });

                    return {
                        ...currentData,
                        underholdskostnader: updatedUnderholdskostnader,
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av underhold", error);
        },
    });
};

export const useUpdateHarTilysnsordning = (underholdsid: number) => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.oppdatereTilsynsordning(behandlingId),
        mutationFn: async (payload: { harTilsynsordning: boolean }): Promise<OppdatereUnderholdResponse> => {
            return (await BEHANDLING_API_V1.api.oppdatereTilsynsordning(Number(behandlingId), underholdsid, payload))
                ?.data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av tilsynsordning", error);
        },
    });
};

export interface GebyrPayload extends BaseMutationVariables, OppdaterGebyrDto {}

export const useUpdateGebyr = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdaterManueltOverstyrtGebyr(behandlingId),
        mutationFn: async (input: GebyrPayload): Promise<GebyrDtoV3> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            const { data } = await BEHANDLING_API_V1.api.oppdaterManueltOverstyrtGebyrV2(Number(behandlingId), payload);
            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        gebyrV3: response,
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av gebyr", error);
        },
    });
};

interface PrivatAvtaleBegrunnelsePayload extends BaseMutationVariables, OppdaterePrivatAvtaleBegrunnelseRequest {}

export const useUpdatePrivatAvtaleBegrunnelse = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdaterePrivatAvtale(behandlingId),
        mutationFn: async (input: PrivatAvtaleBegrunnelsePayload): Promise<OppdaterePrivatAvtaleResponsDto> => {
            const { triggeredBy: _triggeredBy, ...payload } = input;
            const { data } = await BEHANDLING_API_V1.api.oppdaterPrivatAvtaleBegrunnelse(Number(behandlingId), payload);

            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        privatAvtaleV3: response.privatAvtale,
                    };
                },
            );
        },
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av begrunnelse for privat avtale", error);
        },
    });
};
export const useUpdatePrivatAvtale = (privatAvtaleId: number) => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdaterePrivatAvtale(behandlingId),
        mutationFn: async (payload: OppdaterePrivatAvtaleRequest): Promise<OppdaterePrivatAvtaleResponsDto> => {
            const { data } = await BEHANDLING_API_V1.api.oppdaterPrivatAvtale(
                Number(behandlingId),
                privatAvtaleId,
                payload,
            );

            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        privatAvtaleV3: {
                            søknadsbarn: response.privatAvtale.søknadsbarn.map((sb) => {
                                const current = currentData.privatAvtaleV3?.søknadsbarn?.find(
                                    (b) => b.gjelderBarn?.id === sb.gjelderBarn?.id,
                                );
                                return {
                                    ...sb,
                                    begrunnelse: current?.begrunnelse,
                                };
                            }),
                            andreBarn: {
                                ...response.privatAvtale.andreBarn,
                                begrunnelse: currentData.privatAvtaleV3?.andreBarn.begrunnelse,
                            },
                        },
                    };
                },
            );
        },
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av privat avtale", error);
        },
    });
};

export const useUpdateBeregnTilDato = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.oppdaterBehandling(behandlingId),
        mutationFn: async (payload: OppdaterBeregnTilDatoRequestDto): Promise<BehandlingDtoV2> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereBeregnTilDato(Number(behandlingId), payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av opphørsdato", error);
        },
    });
};
export const useUpdateOpphørsdato = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.oppdaterBehandling(behandlingId),
        mutationFn: async (payload: OppdaterOpphorsdatoRequestDto): Promise<BehandlingDtoV2> => {
            const { data } = await BEHANDLING_API_V1.api.oppdatereOpphorsdato(Number(behandlingId), payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av opphørsdato", error);
        },
    });
};

export const useCreatePrivatAvtale = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.opprettePrivatAvtale(behandlingId),
        mutationFn: async (payload: BarnDto): Promise<OppdaterePrivatAvtaleResponsDto> => {
            const { data } = await BEHANDLING_API_V1.api.opprettePrivatAvtale(Number(behandlingId), payload);
            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(
                QueryKeys.behandlingV2(behandlingId),
                (currentData: BehandlingDtoV2): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        privatAvtaleV3: response.privatAvtale,
                    };
                },
            );
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppretting av privat avtale", error);
        },
    });
};

export const useDeletePrivatAvtale = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.slettePrivatAvtale(behandlingId),
        mutationFn: async (privatAvtaleId: number): Promise<void> => {
            await BEHANDLING_API_V1.api.slettePrivatAvtale(Number(behandlingId), privatAvtaleId);
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved sletting av privat avtale", error);
        },
    });
};

export const useOppdaterOpprettP35c = (periode: ResultatBarnebidragsberegningPeriodeDto) => {
    const { id: behandlingId } = useGetBehandlingV2();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdaterBehandling(behandlingId.toString()),
        mutationFn: async (payload: OppdaterParagraf35CDetaljerDto) => {
            const { data } = await BEHANDLING_API_V1.api.oppdaterVedtakParagraf35C(behandlingId, payload);
            return data;
        },

        onSuccess: async (_, variables) => {
            queryClient.setQueryData<VedtakBarnebidragBeregningResult>(
                QueryKeys.beregnBarnebidrag(true),
                (currentData): VedtakBarnebidragBeregningResult => {
                    return {
                        ...currentData,
                        resultat: {
                            ...currentData.resultat,
                            resultatBarn: currentData.resultat.resultatBarn?.map((rb) => {
                                return {
                                    ...rb,
                                    delvedtak: rb.delvedtak.map((dv) => {
                                        if (!dv.delvedtak && !dv.omgjøringsvedtak) {
                                            return {
                                                ...dv,
                                                perioder: dv.perioder.map((p) => {
                                                    if (
                                                        p.klageOmgjøringDetaljer.resultatFraVedtak ===
                                                        periode.klageOmgjøringDetaljer.resultatFraVedtak
                                                    ) {
                                                        return {
                                                            ...p,
                                                            klageOmgjøringDetaljer: {
                                                                ...p.klageOmgjøringDetaljer,
                                                                skalOpprette35c: variables.opprettP35c,
                                                            },
                                                        };
                                                    }
                                                    return p;
                                                }),
                                            };
                                        }
                                        return dv;
                                    }),
                                };
                            }),
                        },
                    };
                },
            );
        },
    });
};

export const useOppdaterManuelleVedtak = (onSuccess?: () => void) => {
    const { id: behandlingId } = useGetBehandlingV2();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdaterBehandling(behandlingId.toString()),
        mutationFn: async (payload: OppdaterManuellVedtakRequest) => {
            const { data } = await BEHANDLING_API_V1.api.oppdaterValgtManuellVedtak(behandlingId, payload);
            return data;
        },
        onSuccess: async (response, payload) => {
            onSuccess?.();
            queryClient.setQueryData<BehandlingDtoV2>(
                QueryKeys.behandlingV2(behandlingId.toString()),
                (currentData): BehandlingDtoV2 => {
                    return {
                        ...currentData,
                        underholdskostnader: response.underholdskostnader,
                        erVedtakUtenBeregning: response.erVedtakUtenBeregning,
                        privatAvtaleV3: response.privatAvtale,
                        virkningstidspunktV3: {
                            ...currentData.virkningstidspunktV3,
                            barn: currentData.virkningstidspunktV3.barn.map((virkningstidspunkt) => {
                                if (virkningstidspunkt.rolle.id === payload.barnId) {
                                    return {
                                        ...virkningstidspunkt,
                                        grunnlagFraVedtak: payload.vedtaksid,
                                    };
                                }
                                return virkningstidspunkt;
                            }),
                        },
                    };
                },
            );
        },
    });
};

export const useMergeVirkningstidspunkt = () => {
    const { behandlingId } = useBehandlingProvider();

    return useMutation({
        mutationKey: MutationKeys.oppdaterBehandling(behandlingId),
        mutationFn: async (): Promise<BehandlingDtoV2> => {
            const { data } = await BEHANDLING_API_V1.api.brukSammeVirkningstidspunktForAlleBarna(Number(behandlingId));
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved merging av virkningstidsdpunkter", error);
        },
    });
};

export const useMergeSamvær = () => {
    const { behandlingId } = useBehandlingProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: MutationKeys.oppdaterBehandling(behandlingId),
        mutationFn: async (): Promise<BehandlingDtoV2> => {
            const { data } = await BEHANDLING_API_V1.api.brukSammeSamvaerForAlleBarna(Number(behandlingId));
            return data;
        },
        onSuccess: (response) => {
            queryClient.setQueryData(QueryKeys.behandlingV2(behandlingId), (): BehandlingDtoV2 => {
                return {
                    ...response,
                };
            });
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved merging av samvær", error);
        },
    });
};

export const useSjekkLasterGrunnlag = (behandlingId: string) => {
    return useQuery({
        queryKey: QueryKeys.sjekkLasterGrunnlag(behandlingId),
        queryFn: async (): Promise<SjekkLasterGrunnlagResponse> => {
            const { data } = await BEHANDLING_API_V1.api.sjekkLasterGrunnlag(Number(behandlingId));
            return data;
        },
        enabled: !!behandlingId,
        staleTime: 0, // Always fresh data
        refetchInterval: (query) => {
            // Poll every 2 seconds if still loading, stop polling when lasterGrunnlag is false
            return query.state.data?.lasterGrunnlag ? 2000 : false;
        },
    });
};
