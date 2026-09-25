import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type SakRedigeringData, SakRedigeringSchema } from "../../felles/sakvisning-schema.ts";
import { useEndringssporing } from "../endringer/useEndringssporing.ts";
import { useSaksrollerSubmit } from "../lagring/useSaksrollerSubmit.ts";
import { useHarÅpneRedigeringer } from "../RedigeringRegisterContext.tsx";
import { useBarnMedUfullstendigRelasjon } from "./useBarnMedUfullstendigRelasjon.ts";
import { useHentSakMedPersoninfo } from "./useHentSakMedPersoninfo.ts";
import { useInitialiserSaksrollerForm } from "./useInitialiserSaksrollerForm.ts";
import { useSakForslag } from "./useSakForslag.tsx";
import { useSaksrollerRollerData } from "./useSaksrollerRollerData.ts";
import { useSaksrollerStatus } from "./useSaksrollerStatus.ts";
import { useSakvisningSamhandlerHandling } from "./useSakvisningSamhandlerHandling.ts";

/**
 * Samler datahenting, skjema, endringssporing og lagring for visning og redigering av saksroller.
 */
export function useSaksrollerVisning(saksnummer: string) {
    const { sak, berikedeRoller, erEktefellebidrag, refetch, dataUpdatedAt } = useHentSakMedPersoninfo(saksnummer);

    const harÅpneRedigeringer = useHarÅpneRedigeringer();
    const {
        feilmelding,
        setFeilmelding,
        valideringsFeil,
        setValideringsFeil,
        suksessmelding,
        setSuksessmelding,
        statusResetKey,
        statusRef,
        nullstillStatusmeldinger,
    } = useSaksrollerStatus(harÅpneRedigeringer);
    const { feil, muligeAndreForeldre, muligeBarnPerMotpart } = useSakForslag({ sak });
    const { hentOgNullstillSamhandler } = useSakvisningSamhandlerHandling();

    const formMethods = useForm<SakRedigeringData>({
        resolver: zodResolver(SakRedigeringSchema),
        mode: "onChange",
    });

    const { reset, watch } = formMethods;
    const roller = watch("roller") || [];

    const { bp, bm, barn, barnIdenter, aktiveRoller, sakstype, muligeBarn } = useSaksrollerRollerData({
        roller,
        berikedeRoller,
        muligeBarnPerMotpart,
    });

    useInitialiserSaksrollerForm({
        berikedeRoller,
        dataUpdatedAt,
        reset,
        saksnummer,
        onDataReset: () => {
            setFeilmelding(null);
            setValideringsFeil(null);
        },
    });

    const barnMedUfullstendigRelasjon = useBarnMedUfullstendigRelasjon({
        barnIdenter,
        bidragspliktigIdent: bp?.fodselsnummer,
        bidragsmottakerIdent: bm?.fodselsnummer,
        harSak: !!sak,
    });

    const { endringsliste, harEndringer } = useEndringssporing({
        opprinneligeRoller: berikedeRoller,
        nåværendeRoller: aktiveRoller,
        barnMedUfullstendigRelasjon,
        dataOppdatertNøkkel: dataUpdatedAt,
        onNyEndring: nullstillStatusmeldinger,
    });

    const { handleSubmitAsync, isPending } = useSaksrollerSubmit(saksnummer, formMethods, {
        setFeilmelding,
        setValideringsFeil,
        setSuksessmelding,
    });

    const funnetPersonISak = (fnr: string) => sak.roller.some((r) => r.fodselsnummer === fnr);
    const erNyPerson = (fnr?: string) => (fnr ? !funnetPersonISak(fnr) : undefined);
    const samletFeilmelding = feilmelding || feil;

    return {
        sak,
        erEktefellebidrag,
        formMethods,
        roller,
        bp,
        bm,
        barn,
        aktiveRoller,
        sakstype,
        muligeBarn,
        muligeAndreForeldre,
        dataUpdatedAt,
        hentOgNullstillSamhandler,
        barnMedUfullstendigRelasjon,
        endringsliste,
        isPending,
        nullstillStatusmeldinger,
        funnetPersonISak,
        erNyPerson,
        samletFeilmelding,
        statusRef,
        sakButtons: {
            onSubmit: handleSubmitAsync,
            onRefetch: refetch,
            feilmelding: samletFeilmelding || undefined,
            valideringsFeil,
            harAdvarsel: barnMedUfullstendigRelasjon.length > 0,
            harEndringer,
            suksessmelding,
            statusRef,
            statusResetKey,
        },
    };
}
