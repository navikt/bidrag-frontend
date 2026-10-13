import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type Sakstype, sakstypeForArbeidsfordeling } from "../../felles/saksregler.ts";
import { lagSakRedigeringSchema, type SakRedigeringData } from "../../felles/sakvisning-schema.ts";
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

function useSaksrollerForm({
    berikedeRoller,
    dataUpdatedAt,
    saksnummer,
    sakstype,
    onDataReset,
}: {
    berikedeRoller: Parameters<typeof useInitialiserSaksrollerForm>[0]["berikedeRoller"];
    dataUpdatedAt: number;
    saksnummer: string;
    sakstype: Sakstype;
    onDataReset: () => void;
}) {
    const formMethods = useForm<SakRedigeringData>({
        resolver: zodResolver(lagSakRedigeringSchema(sakstype)),
        mode: "onSubmit",
    });
    const { reset, watch } = formMethods;
    const roller = watch("roller") || [];

    useInitialiserSaksrollerForm({ berikedeRoller, dataUpdatedAt, reset, saksnummer, onDataReset });

    return { formMethods, roller };
}

function relasjonskontrollStatus({ isError, isLoading }: { isError: boolean; isLoading: boolean }) {
    if (isError) return "feilet" as const;
    if (isLoading) return "venter" as const;
    return undefined;
}

/**
 * Samler datahenting, skjema, endringssporing og lagring for visning og redigering av saksroller.
 */
export function useSaksrollerVisning(saksnummer: string) {
    const { sak, berikedeRoller, refetch, dataUpdatedAt } = useHentSakMedPersoninfo(saksnummer);

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
    const sakstype = sakstypeForArbeidsfordeling(sak.arbeidsfordeling);
    const erEktefellebidrag = sakstype === "Ektefellebidrag";

    const { formMethods, roller } = useSaksrollerForm({
        berikedeRoller,
        dataUpdatedAt,
        saksnummer,
        sakstype,
        onDataReset: () => {
            setFeilmelding(null);
            setValideringsFeil(null);
        },
    });

    const { bp, bm, barn, barnIdenter, aktiveRoller, muligeBarn } = useSaksrollerRollerData({
        roller,
        berikedeRoller,
        muligeBarnPerMotpart,
    });

    const relasjonskontroll = useBarnMedUfullstendigRelasjon({
        barnIdenter,
        bidragspliktigIdent: bp?.fodselsnummer,
        bidragsmottakerIdent: bm?.fodselsnummer,
        harSak: !!sak,
    });
    const { barnMedUfullstendigRelasjon } = relasjonskontroll;

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
        lagringBlokkert: relasjonskontroll.isLoading || relasjonskontroll.isError,
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
            relasjonskontroll: relasjonskontrollStatus(relasjonskontroll),
            harEndringer,
            suksessmelding,
            statusRef,
            statusResetKey,
        },
    };
}
