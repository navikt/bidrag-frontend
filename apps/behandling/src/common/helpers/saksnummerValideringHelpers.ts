import type {
    BehandlingDtoV2,
    SamvaerValideringsfeilDto,
    UnderholdskostnadValideringsfeil,
    VirkningstidspunktFeilV2Dto,
} from "@bidrag/api/BidragBehandlingApiV1";
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
        if (harUnderholdskostnadValideringsfeil(underhold.valideringsfeil)) {
            leggTil(getSaksnummerForIdent(roller, underhold.gjelderBarn.ident));
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
