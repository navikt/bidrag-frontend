import type {
    BehandlingDtoV2,
    SamvaerValideringsfeilDto,
    UnderholdskostnadValideringsfeil,
    VirkningstidspunktFeilV2Dto,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { checkIfRolleHasValideringsfeil, getSaksnummerForIdent } from "./inntektFormHelpers";

const harVirkningstidspunktValideringsfeil = (valideringsfeil?: VirkningstidspunktFeilV2Dto | null) =>
    !!(
        valideringsfeil?.manglerVirkningstidspunkt ||
        valideringsfeil?.manglerBegrunnelse ||
        valideringsfeil?.manglerOpphørsdato ||
        valideringsfeil?.kanIkkeSetteOpphørsdatoEtterEtterfølgendeVedtak ||
        valideringsfeil?.manglerÅrsakEllerAvslag ||
        valideringsfeil?.måVelgeVedtakForBeregning ||
        valideringsfeil?.manglerVurderingAvSkolegang ||
        valideringsfeil?.virkningstidspunktKanIkkeVæreSenereEnnOpprinnelig
    );

const harUnderholdskostnadValideringsfeil = (valideringsfeil?: UnderholdskostnadValideringsfeil | null) =>
    !!(
        valideringsfeil?.manglerBegrunnelse ||
        valideringsfeil?.manglerPerioderForTilsynsordning ||
        !!valideringsfeil?.faktiskTilsynsutgift ||
        !!valideringsfeil?.stønadTilBarnetilsyn ||
        !!valideringsfeil?.tilleggsstønad ||
        !!valideringsfeil?.tilleggsstønadsperioderUtenFaktiskTilsynsutgift.length
    );

const harSamværValideringsfeil = (valideringsfeil?: SamvaerValideringsfeilDto | null) =>
    !!(
        valideringsfeil?.manglerSamvær ||
        valideringsfeil?.manglerBegrunnelse ||
        valideringsfeil?.ingenLøpendeSamvær ||
        valideringsfeil?.harPeriodiseringsfeil ||
        valideringsfeil?.hullIPerioder?.length > 0 ||
        valideringsfeil?.overlappendePerioder?.length > 0
    );

/**
 * Samler alle saksnummer som har minst én valideringsfeil på tvers av alle stegene
 * (virkningstidspunkt, inntekt, underholdskostnad, samvær, privat avtale og gebyr).
 *
 * Brukes til å markere saksfaner i `SakHeader` når en behandling dekker flere saker
 * (forholdsmessig fordeling), på samme måte som `BarnebidragSideMenu` markerer stegene med feil.
 * Hver feil knyttes til saken den tilhører via rollens/barnets eget saksnummer.
 */
export const getSaksnummerMedValideringsfeil = (behandling: BehandlingDtoV2): Set<string> => {
    const { roller } = behandling;
    const saksnummerMedFeil = new Set<string>();
    const leggTil = (saksnummer?: string | null) => {
        if (saksnummer) {
            saksnummerMedFeil.add(saksnummer);
        }
    };

    behandling.virkningstidspunktV3?.barn?.forEach((barn) => {
        if (harVirkningstidspunktValideringsfeil(barn.valideringsfeilV2)) {
            leggTil(barn.rolle.saksnummer);
        }
    });

    behandling.inntekterV2?.forEach((inntektRolle) => {
        if (checkIfRolleHasValideringsfeil(inntektRolle.inntekter?.valideringsfeil)) {
            leggTil(inntektRolle.gjelder.saksnummer);
        }
    });

    behandling.underholdskostnader?.forEach((underhold) => {
        if (!harUnderholdskostnadValideringsfeil(underhold.valideringsfeil)) {
            return;
        }
        if (underhold.gjelderBarn.medIBehandlingen) {
            leggTil(getSaksnummerForIdent(roller, underhold.gjelderBarn.ident));
        } else {
            // Andre barn tilhører en konkret bidragsmottaker; knytt feilen til den bidragsmottakerens sak.
            const bidragsmottaker = roller.find((rolle) => rolle.id === underhold.gjelderBarn.bidragsmottakerId);
            leggTil(bidragsmottaker?.saksnummer);
        }
    });

    behandling.samværV2?.barn?.forEach((barn) => {
        if (harSamværValideringsfeil(barn.valideringsfeil)) {
            leggTil(getSaksnummerForIdent(roller, barn.gjelderBarn));
        }
    });

    behandling.privatAvtaleV3?.søknadsbarn?.forEach((søknadsbarn) => {
        if (søknadsbarn.privatAvtale?.valideringsfeil?.manglerBegrunnelse) {
            leggTil(
                søknadsbarn.privatAvtale.valideringsfeil.gjelderPerson?.saksnummer ??
                    getSaksnummerForIdent(roller, søknadsbarn.gjelderBarn.ident),
            );
        }
    });

    behandling.gebyrV3?.saker?.forEach((sak) => {
        if (sak.gebyrRoller.some((gebyrRolle) => gebyrRolle.valideringsfeil?.manglerBegrunnelse)) {
            leggTil(sak.saksnummer);
        }
    });

    return saksnummerMedFeil;
};

type RolleMedSaksnummer = { ident?: string | null; saksnummer?: string | null; rolletype: Rolletype };

/**
 * Finner saksnummer(ene) en person er knyttet til via rollene. BP (bidragspliktig) er del av alle
 * sakene i en forholdsmessig fordeling, men finnes bare én gang i `roller` - opplysninger knyttet
 * til BP markerer derfor alle sakene.
 */
const finnSaksnummerForIdent = (
    roller: RolleMedSaksnummer[],
    ident: string | null | undefined,
    alleSaksnummer: string[],
    fallbackSaksnummer?: string | null,
): string[] => {
    if (!ident) {
        return [];
    }
    const matchendeRoller = roller.filter((rolle) => rolle.ident === ident);
    if (matchendeRoller.some((rolle) => rolle.rolletype === Rolletype.BP)) {
        return alleSaksnummer;
    }
    return matchendeRoller.map((rolle) => rolle.saksnummer ?? fallbackSaksnummer ?? "");
};

/**
 * Samler alle saksnummer som har nye opplysninger (ikke-aktiverte endringer i grunnlagsdata)
 * på tvers av inntekt, boforhold og underhold. Brukes til å markere saksfaner i `SakHeader`
 * på samme måte som `BarnebidragSideMenu` markerer stegene med et oppdateringsikon.
 *
 * Opplysninger knyttet til en konkret person (inntekt, husstandsmedlem, arbeidsforhold,
 * stønad til barnetilsyn) knyttes til saken(e) personen tilhører via rollene. Opplysninger som
 * gjelder bidragsmottaker på tvers av saker (andre voksne i husstanden, sivilstand) markerer alle
 * sakene i behandlingen.
 */
export const getSaksnummerMedNyeOpplysninger = (behandling: BehandlingDtoV2): Set<string> => {
    const { roller, saksnummer: behandlingSaksnummer, ikkeAktiverteEndringerIGrunnlagsdata: endringer } = behandling;
    const saksnummerMedOpplysninger = new Set<string>();
    const alleSaksnummer = Array.from(
        new Set(roller.map((rolle) => rolle.saksnummer ?? behandlingSaksnummer).filter((s): s is string => !!s)),
    );
    const leggTil = (saksnummer?: string | null) => {
        if (saksnummer) {
            saksnummerMedOpplysninger.add(saksnummer);
        }
    };
    const leggTilForIdent = (ident?: string | null) => {
        finnSaksnummerForIdent(roller, ident, alleSaksnummer, behandlingSaksnummer).forEach(leggTil);
    };
    const leggTilAlleSaker = () => {
        alleSaksnummer.forEach(leggTil);
    };

    if (endringer) {
        Object.values(endringer.inntekter).forEach((liste) => {
            liste.forEach((inntekt) => {
                leggTilForIdent(inntekt.ident);
            });
        });

        [
            endringer.husstandsmedlem,
            endringer.husstandsmedlemBM,
            endringer.husstandsmedlemBMV2,
            endringer.husstandsbarn,
        ].forEach((liste) => {
            liste?.forEach((medlem) => {
                leggTilForIdent(medlem.ident);
            });
        });

        endringer.arbeidsforhold?.forEach((arbeidsforhold) => {
            leggTilForIdent(arbeidsforhold.partPersonId);
        });

        if (endringer.stønadTilBarnetilsyn) {
            Object.keys(endringer.stønadTilBarnetilsyn.stønadTilBarnetilsyn ?? {}).forEach(leggTilForIdent);
            Object.keys(endringer.stønadTilBarnetilsyn.grunnlag ?? {}).forEach(leggTilForIdent);
        }

        if (endringer.andreVoksneIHusstanden || endringer.sivilstand) {
            leggTilAlleSaker();
        }
    }

    return saksnummerMedOpplysninger;
};
