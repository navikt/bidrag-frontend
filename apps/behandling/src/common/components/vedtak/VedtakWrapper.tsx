import {
    type InntektValideringsfeil,
    type MaBekrefteNyeOpplysninger,
    OpplysningerType,
    Rolletype,
    TypeBehandling,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyShort, ErrorSummary, Heading } from "@navikt/ds-react";
import { Fragment, type PropsWithChildren } from "react";
import type { BarnebidragStepper } from "../../../barnebidrag/enum/BarnebidragStepper";
import type { ForskuddStepper } from "../../../forskudd/enum/ForskuddStepper";
import type { SærligeutgifterStepper } from "../../../særbidrag/enum/SærligeutgifterStepper";
import type { VedtakBeregningFeil } from "../../../types/vedtakTypes";
import { capitalizeFirstLetter } from "../../../utils/string-utils";
import behandlingQueryKeys, {
    toUnderholdskostnadTabQueryParameter,
    toUnderholdskostnadTabQueryParameterForUnderhold,
} from "../../constants/behandlingQueryKeys";
import elementIds from "../../constants/elementIds";
import texts, { mapOpplysningtypeSomMåBekreftesTilFeilmelding, rolletypeTilVisningsnavn } from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useGetBehandlingV2 } from "../../hooks/useApiData";

type STEPSTYPE =
    | { [_key in ForskuddStepper]: number }
    | { [_key in SærligeutgifterStepper]: number }
    | { [_key in BarnebidragStepper]: number };
type VedtakWrapperProps = {
    feil: VedtakBeregningFeil;
    steps: STEPSTYPE;
};

const validerForRoller = {
    [TypeBehandling.FORSKUDD]: [Rolletype.BM],
    [TypeBehandling.SAeRBIDRAG]: [Rolletype.BA, Rolletype.BM, Rolletype.BP],
    [TypeBehandling.BIDRAG]: [Rolletype.BA, Rolletype.BM, Rolletype.BP],
};

export default function VedtakWrapper({ feil, steps, children }: PropsWithChildren<VedtakWrapperProps>) {
    const { onStepChange: onStepChangeFn } = useBehandlingProvider();
    const onStepChange = (step: number, query?: Record<string, string>, hash?: string) =>
        onStepChangeFn(step, { navigertFra: "vedtak", ...query }, hash);
    const { type, roller } = useGetBehandlingV2();
    // Legger `saksnummer` direkte på query-en (kjent her, siden vi har rollen/RolleDto-en
    // tilgjengelig), slik at sidemenyen kan synkronisere `selectedSaksnummer` uten å måtte slå
    // opp rollen selv basert på `tab`-verdien.
    const medSaksnummer = (query: Record<string, string>, saksnummer?: string | null) =>
        saksnummer ? { ...query, [behandlingQueryKeys.saksnummer]: saksnummer } : query;
    function renderFeilmeldinger() {
        if (!feil?.detaljer) return null;
        const feilInnhold = feil?.detaljer;
        let feilliste = [];
        if (feilInnhold.privatAvtale != null && "privat_avtale" in steps) {
            feilInnhold.privatAvtale.forEach((value) => {
                if (value?.manglerBegrunnelse === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(steps.privat_avtale, medSaksnummer({}, value.gjelderPerson?.saksnummer))
                            }
                        >
                            Privat avtale: Begrunnelse må fylles ut for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
                }
                if (value?.ingenLøpendePeriode === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(steps.privat_avtale, medSaksnummer({}, value.gjelderPerson?.saksnummer))
                            }
                        >
                            Privat avtale: Det må legges til løpende periode for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
                }
                if (value?.manglerAvtaledato === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(steps.privat_avtale, medSaksnummer({}, value.gjelderPerson?.saksnummer))
                            }
                        >
                            Privat avtale: Avtaledato mangler for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
                }
                if (value?.måVelgeVedtakHvisAvtaletypeErVedtakFraNav === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(steps.privat_avtale, medSaksnummer({}, value.gjelderPerson?.saksnummer))
                            }
                        >
                            Innkreving: Vedtak må velges når "Vedtak fra Nav" er valgt for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
                }
                if (value?.harPeriodiseringsfeil) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(steps.privat_avtale, medSaksnummer({}, value.gjelderPerson?.saksnummer))
                            }
                        >
                            Privat avtale: Perioder for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
                }
            });
        }
        if (feilInnhold.virkningstidspunkt != null && "virkningstidspunkt" in steps) {
            feilInnhold.virkningstidspunkt.forEach((virkningstidspunkt) => {
                const rolle = virkningstidspunkt.gjelder;
                if (virkningstidspunkt?.manglerBegrunnelse === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.virkningstidspunkt,
                                    medSaksnummer({ tab: rolle.id?.toString() }, rolle.saksnummer),
                                )
                            }
                        >
                            Virkningstidspunkt: Begrunnelse må fylles ut ved opphør
                        </ErrorSummary.Item>,
                    );
                }
                if (virkningstidspunkt?.kanIkkeSetteOpphørsdatoEtterEtterfølgendeVedtak === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.virkningstidspunkt,
                                    medSaksnummer({ tab: rolle.id?.toString() }, rolle.saksnummer),
                                )
                            }
                        >
                            Virkningstidspunkt: Kan ikke sette opphørsdato etter etterfølgende vedtak for barn{" "}
                            {rolle.navn}
                        </ErrorSummary.Item>,
                    );
                }
                if (virkningstidspunkt?.manglerVurderingAvSkolegang === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.virkningstidspunkt,
                                    medSaksnummer({ tab: rolle.id?.toString() }, rolle.saksnummer),
                                )
                            }
                        >
                            Virkningstidspunkt: Vurdering av skolegang må fylles ut ved 18 års bidrag
                        </ErrorSummary.Item>,
                    );
                }
                if (virkningstidspunkt?.manglerOpphørsdato === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.virkningstidspunkt,
                                    medSaksnummer({ tab: rolle.id?.toString() }, rolle.saksnummer),
                                )
                            }
                        >
                            Virkningstidspunkt: Opphørsdato må settes for {rolle.navn} ved 18 års bidrag
                        </ErrorSummary.Item>,
                    );
                }
                if (virkningstidspunkt?.måVelgeVedtakForBeregning === true) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.virkningstidspunkt,
                                    medSaksnummer({ tab: rolle.id?.toString() }, rolle.saksnummer),
                                )
                            }
                        >
                            Virkningstidspunkt: Vedtak må velges for {rolle.navn}
                        </ErrorSummary.Item>,
                    );
                }
            });
        }
        if (feilInnhold.utgift != null && "utgift" in steps) {
            const feillisteUtgifter = [];
            if (feilInnhold.utgift.manglerUtgifter) {
                feillisteUtgifter.push(
                    <ErrorSummary.Item onClick={() => onStepChange(steps.utgift)}>
                        Utgift: Minst en utgift må legges til
                    </ErrorSummary.Item>,
                );
            }
            if (feilInnhold.utgift.maksGodkjentBeløp?.manglerBeløp === true) {
                feillisteUtgifter.push(
                    <ErrorSummary.Item onClick={() => onStepChange(steps.utgift)}>
                        Utgift: Maks godkjent beløp må fylles ut når godkjent beløp skal skjønnsjusteres
                    </ErrorSummary.Item>,
                );
            }
            if (feilInnhold.utgift.maksGodkjentBeløp?.manglerBegrunnelse === true) {
                feillisteUtgifter.push(
                    <ErrorSummary.Item onClick={() => onStepChange(steps.utgift)}>
                        Utgift: Begrunnelse på maks godkjent beløp må fylles ut når godkjent beløp skal skjønnsjusteres
                    </ErrorSummary.Item>,
                );
            }
            if (feillisteUtgifter.length === 0) {
                feillisteUtgifter.push(
                    <ErrorSummary.Item onClick={() => onStepChange(steps.utgift)}>Utgift</ErrorSummary.Item>,
                );
            }
            feilliste.push(...feillisteUtgifter);
        }

        if (feilInnhold.samvær != null && "samvær" in steps) {
            feilInnhold.samvær.forEach((value) => {
                // `tab` må være samvær-barnets egen id (matcher `useActiveSamværTab`/sidemenyens
                // aktiv-sjekk). `saksnummer` slås opp via barnets ident, brukes til å synkronisere
                // `selectedSaksnummer` til riktig sak (relevant ved forholdsmessig fordeling).
                const samværTabQuery = medSaksnummer(
                    { [behandlingQueryKeys.tab]: value.samværId?.toString() },
                    value.gjelderRolle?.saksnummer,
                );
                if (value.harPeriodiseringsfeil)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.samvær,
                                    samværTabQuery,
                                    `${elementIds.seksjon_samvær}_${value.samværId}`,
                                )
                            }
                        >
                            Samvær: Perioder for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
                if (value.manglerBegrunnelse)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.samvær,
                                    samværTabQuery,
                                    `${elementIds.seksjon_samvær}_${value.samværId}`,
                                )
                            }
                        >
                            Samvær: Mangler begrunnelse for barn {value.gjelderBarnNavn}
                        </ErrorSummary.Item>,
                    );
            });
        }
        if (feilInnhold.underholdskostnad != null && "underholdskostnad" in steps) {
            const manglerBegrunnelseForAndreBarn = feilInnhold.underholdskostnad.some(
                (v) => !v.gjelderBarn.medIBehandlingen && v.manglerBegrunnelse,
            );
            if (manglerBegrunnelseForAndreBarn)
                feilliste.push(
                    <ErrorSummary.Item
                        onClick={() =>
                            onStepChange(steps.underholdskostnad, {
                                [behandlingQueryKeys.tab]: toUnderholdskostnadTabQueryParameter(),
                            })
                        }
                    >
                        Underholdskostnad: Mangler begrunnelse for andre barn til Bidragsmottaker
                    </ErrorSummary.Item>,
                );
            feilInnhold.underholdskostnad.forEach((value) => {
                const underholdSaksnummer = roller.find((r) => r.id === value.gjelderBarn.rolleId)?.saksnummer;
                if (value.manglerPerioderForTilsynsordning)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.underholdskostnad,
                                    medSaksnummer(
                                        {
                                            [behandlingQueryKeys.tab]:
                                                toUnderholdskostnadTabQueryParameterForUnderhold(value),
                                        },
                                        underholdSaksnummer,
                                    ),
                                )
                            }
                        >
                            Underholdskostnad: Mangler perioder for tilsynsordning for barn {value.gjelderBarn.navn}
                        </ErrorSummary.Item>,
                    );
                if (value.tilleggsstønad)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.underholdskostnad,
                                    medSaksnummer(
                                        {
                                            [behandlingQueryKeys.tab]:
                                                toUnderholdskostnadTabQueryParameterForUnderhold(value),
                                        },
                                        underholdSaksnummer,
                                    ),
                                    `${elementIds.seksjon_underholdskostnad_tilleggstønad}`,
                                )
                            }
                        >
                            Underholdskostnad: Ugyldig perioder i tilleggsstønad for barn {value.gjelderBarn.navn}
                        </ErrorSummary.Item>,
                    );
                if (value.stønadTilBarnetilsyn)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.underholdskostnad,
                                    medSaksnummer(
                                        {
                                            [behandlingQueryKeys.tab]:
                                                toUnderholdskostnadTabQueryParameterForUnderhold(value),
                                        },
                                        underholdSaksnummer,
                                    ),
                                    `${elementIds.seksjon_underholdskostnad_barnetilsyn}`,
                                )
                            }
                        >
                            Underholdskostnad: Ugyldig perioder i stønad til barnetilsyn for barn{" "}
                            {value.gjelderBarn.navn}
                        </ErrorSummary.Item>,
                    );

                if (value.tilleggsstønadsperioderUtenFaktiskTilsynsutgift.length > 0)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.underholdskostnad,
                                    medSaksnummer(
                                        {
                                            [behandlingQueryKeys.tab]:
                                                toUnderholdskostnadTabQueryParameterForUnderhold(value),
                                        },
                                        underholdSaksnummer,
                                    ),
                                    `${elementIds.seksjon_underholdskostnad_tilleggstønad}`,
                                )
                            }
                        >
                            Underholdskostnad: Tilleggsstønad uten faktisk tilsynsutgift for barn{" "}
                            {value.gjelderBarn.navn}
                        </ErrorSummary.Item>,
                    );
                if (value.faktiskTilsynsutgift)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.underholdskostnad,
                                    medSaksnummer(
                                        {
                                            [behandlingQueryKeys.tab]:
                                                toUnderholdskostnadTabQueryParameterForUnderhold(value),
                                        },
                                        underholdSaksnummer,
                                    ),
                                    `${elementIds.seksjon_underholdskostnad_tilysnsutgifter}`,
                                )
                            }
                        >
                            Underholdskostnad: Ugyldig perioder i faktiske tilsynsutgifter for barn{" "}
                            {value.gjelderBarn.navn}
                        </ErrorSummary.Item>,
                    );

                if (value.manglerBegrunnelse && value.gjelderBarn.medIBehandlingen)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.underholdskostnad,
                                    medSaksnummer(
                                        {
                                            [behandlingQueryKeys.tab]:
                                                toUnderholdskostnadTabQueryParameterForUnderhold(value),
                                        },
                                        underholdSaksnummer,
                                    ),
                                )
                            }
                        >
                            Underholdskostnad: Mangler begrunnelse for barn {value.gjelderBarn.navn}
                        </ErrorSummary.Item>,
                    );
            });
        }
        if (feilInnhold.gebyr != null && "gebyr" in steps) {
            feilInnhold.gebyr.forEach((value) => {
                if (value.manglerBegrunnelse)
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.gebyr,
                                    medSaksnummer(
                                        { [behandlingQueryKeys.tab]: value.gjelder.id?.toString() },
                                        value.gjelder.saksnummer,
                                    ),
                                )
                            }
                        >
                            Gebyr: Begrunnelse må fylles ut når gebyrvalget er manuelt overstyrt (
                            {rolletypeTilVisningsnavn(value.gjelder)})
                        </ErrorSummary.Item>,
                    );
            });
        }
        if (feilInnhold.husstandsmedlem != null) {
            feilInnhold.husstandsmedlem.forEach((value) => {
                feilliste.push(
                    <ErrorSummary.Item onClick={() => onStepChange(steps.boforhold)}>
                        Boforhold: Perioder for barn {value.barn.navn}
                    </ErrorSummary.Item>,
                );
            });
        }

        if (feilInnhold.andreVoksneIHusstanden != null) {
            feilliste.push(
                <ErrorSummary.Item onClick={() => onStepChange(steps.boforhold)}>
                    {feilInnhold.andreVoksneIHusstanden.manglerPerioder
                        ? "Mangler perioder for andre voksne i husstanden"
                        : "Andre voksne i husstanden har ugyldige perioder"}
                </ErrorSummary.Item>,
            );
        }
        if (feilInnhold.sivilstand != null) {
            feilliste.push(
                <ErrorSummary.Item onClick={() => onStepChange(steps.boforhold, null, elementIds.seksjon_sivilstand)}>
                    Sivilstand har ugyldige perioder
                </ErrorSummary.Item>,
            );
        }
        if (feilInnhold.inntekter != null) {
            feilliste = [
                ...feilliste,
                ...validerInntekt(
                    texts.title.skattepliktigeogPensjonsgivendeInntekt,
                    elementIds.seksjon_inntekt_skattepliktig,
                    feilInnhold.inntekter.årsinntekter,
                ),
                ...validerInntekt(
                    texts.title.barnetillegg,
                    elementIds.seksjon_inntekt_barnetillegg,
                    feilInnhold.inntekter.barnetillegg,
                ),

                ...validerInntekt(
                    texts.title.kontantstøtte,
                    elementIds.seksjon_inntekt_kontantstøtte,
                    feilInnhold.inntekter.kontantstøtte,
                ),
                ...validerInntekt(
                    texts.title.utvidetBarnetrygd,
                    elementIds.seksjon_inntekt_utvidetbarnetrygd,
                    feilInnhold.inntekter.utvidetBarnetrygd,
                ),
                ...validerInntekt(
                    texts.title.småbarnstillegg,
                    elementIds.seksjon_inntekt_småbarnstillegg,
                    feilInnhold.inntekter.småbarnstillegg,
                ),
            ];
        }
        feilInnhold.måBekrefteNyeOpplysninger
            ?.filter((a) => a.type !== OpplysningerType.BOFORHOLD || a.gjelderBarn != null)
            ?.forEach((value) => {
                feilliste.push(
                    <ErrorSummary.Item
                        onClick={() =>
                            onStepChange(
                                opplysningTilStep(value, steps),
                                medSaksnummer(
                                    {
                                        [behandlingQueryKeys.tab]:
                                            value.type === OpplysningerType.BARNETILSYN
                                                ? toUnderholdskostnadTabQueryParameter(
                                                      value.gjelderBarn?.husstandsmedlemId,
                                                      value.underholdskostnadId,
                                                      true,
                                                  )
                                                : value.rolle?.id?.toString(),
                                    },
                                    value.rolle?.saksnummer,
                                ),
                                opplysningTilElementId(value),
                            )
                        }
                    >
                        {mapOpplysningtypeSomMåBekreftesTilFeilmelding(value, type)}
                    </ErrorSummary.Item>,
                );
            });
        if (feilliste.length === 0) {
            const feilInnhold =
                typeof feil.detaljer === "string"
                    ? []
                    : Object.keys(feil.detaljer)
                          .filter((key) =>
                              !Array.isArray(feil.detaljer[key])
                                  ? feil.detaljer[key] != null
                                  : feil.detaljer[key].length > 0,
                          )
                          .map((key) => capitalizeFirstLetter(key));

            feilliste.push(
                <ErrorSummary.Item onClick={() => onStepChange(steps.vedtak)}>
                    {feil.melding}
                    {feilInnhold.length > 0 && (
                        <>
                            <br /> Valideringer som feilet: {feilInnhold.join(", ")}
                        </>
                    )}
                </ErrorSummary.Item>,
            );
        }
        return feilliste;
    }
    if (feil) {
        if (!feil?.detaljer) {
            return (
                <Alert variant={"error"} size="small">
                    <Heading spacing size="small" level="3">
                        {texts.error.ukjentfeil}
                    </Heading>
                    <BodyShort>{texts.error.beregning}</BodyShort>
                </Alert>
            );
        }
        return (
            <ErrorSummary heading={texts.varsel.beregneFeil} size="small">
                {renderFeilmeldinger().map((Component, index) => (
                    <Fragment key={`feilmelding ${index}`}>{Component}</Fragment>
                ))}
            </ErrorSummary>
        );
    }

    function validerInntekt(
        tekst: string,
        elementId: string,
        inntektvalideringsfeil?: InntektValideringsfeil | InntektValideringsfeil[],
    ) {
        const feilliste = [];
        if (!inntektvalideringsfeil) return feilliste;
        if (Array.isArray(inntektvalideringsfeil)) {
            validerForRoller[type].forEach((rolletype) => {
                const valideringsfeil = inntektvalideringsfeil.find((a) => a.rolle.rolletype === rolletype);
                if (valideringsfeil) {
                    feilliste.push(
                        <ErrorSummary.Item
                            onClick={() =>
                                onStepChange(
                                    steps.inntekt,
                                    medSaksnummer(
                                        { [behandlingQueryKeys.tab]: valideringsfeil.rolle?.id?.toString() },
                                        valideringsfeil.rolle?.saksnummer,
                                    ),
                                    elementId,
                                )
                            }
                        >
                            Inntekter: Perioder i {tekst.toLowerCase()}{" "}
                            {type !== TypeBehandling.FORSKUDD
                                ? ` for ${rolletypeTilVisningsnavn(valideringsfeil.rolle)}`
                                : ""}
                        </ErrorSummary.Item>,
                    );
                }
            });
        } else {
            feilliste.push(
                <ErrorSummary.Item
                    onClick={() =>
                        onStepChange(
                            steps.inntekt,
                            medSaksnummer(
                                { [behandlingQueryKeys.tab]: inntektvalideringsfeil.rolle?.id?.toString() },
                                inntektvalideringsfeil.rolle?.saksnummer,
                            ),
                            elementId,
                        )
                    }
                >
                    Inntekter: Perioder i {tekst.toLowerCase()}{" "}
                    {type !== TypeBehandling.FORSKUDD
                        ? ` for ${rolletypeTilVisningsnavn(inntektvalideringsfeil.rolle)}`
                        : ""}
                </ErrorSummary.Item>,
            );
        }
        return feilliste;
    }

    return <>{children}</>;
}

const opplysningTilStep = (opplysningstype: MaBekrefteNyeOpplysninger, steps: STEPSTYPE) => {
    switch (opplysningstype.type) {
        case OpplysningerType.BARNETILSYN:
            return "underholdskostnad" in steps ? steps.underholdskostnad : steps.vedtak;
        case OpplysningerType.SKATTEPLIKTIGE_INNTEKTER:
        case OpplysningerType.SMABARNSTILLEGG:
        case OpplysningerType.UTVIDET_BARNETRYGD:
        case OpplysningerType.BARNETILLEGG:
        case OpplysningerType.KONTANTSTOTTE:
            return steps.inntekt;
        case OpplysningerType.SIVILSTAND:
        case OpplysningerType.BOFORHOLD_ANDRE_VOKSNE_I_HUSSTANDEN:
        case OpplysningerType.BOFORHOLD:
        case OpplysningerType.BOFORHOLDBMSOKNADSBARN:
            return steps.boforhold;
    }
};
const opplysningTilElementId = (opplysninger: MaBekrefteNyeOpplysninger) => {
    switch (opplysninger.type) {
        case OpplysningerType.SKATTEPLIKTIGE_INNTEKTER:
            return elementIds.seksjon_inntekt_skattepliktig;
        case OpplysningerType.SMABARNSTILLEGG:
            return elementIds.seksjon_inntekt_småbarnstillegg;
        case OpplysningerType.UTVIDET_BARNETRYGD:
            return elementIds.seksjon_inntekt_utvidetbarnetrygd;
        case OpplysningerType.BARNETILLEGG:
            return elementIds.seksjon_inntekt_barnetillegg;
        case OpplysningerType.KONTANTSTOTTE:
            return elementIds.seksjon_inntekt_kontantstøtte;
        case OpplysningerType.BOFORHOLD:
            return opplysninger.gjelderBarn?.husstandsmedlemId
                ? `${elementIds.seksjon_boforhold}_${opplysninger.gjelderBarn?.husstandsmedlemId}`
                : `${elementIds.seksjon_boforhold}`;
        case OpplysningerType.SIVILSTAND:
            return elementIds.seksjon_sivilstand;
        case OpplysningerType.BOFORHOLD_ANDRE_VOKSNE_I_HUSSTANDEN:
            return elementIds.seksjon_andreVoksneIHusstand;
    }
};
