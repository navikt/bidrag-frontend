import { dateToDDMMYYYYString } from "@bidrag/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Heading, HGrid, HStack, InfoCard, Loader, LocalAlert, Page, VStack } from "@navikt/ds-react";
import { type ComponentProps, type RefObject, Suspense, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import BarnVisning from "./barn-rolle/BarnVisning.tsx";
import LeggTilBarn from "./barn-rolle/LeggTilBarn.tsx";
import SakButtons from "./components/SakButtons.tsx";
import Endringsoppsummering from "./Endringsoppsummering.tsx";
import type { Endringsrad } from "./endringsoppsummering-utils.ts";
import { SakstypeTags } from "./felles/SakstypeTags.tsx";
import ForelderRolleVisning from "./forelder-rolle/ForelderRolleVisning.tsx";
import { useEndringssporing } from "./hooks/useEndringssporing.ts";
import { useHentSakMedPersoninfo } from "./hooks/useHentSakMedPersoninfo.ts";
import { useInitialiserSaksrollerForm } from "./hooks/useInitialiserSaksrollerForm.ts";
import { useSakForslag } from "./hooks/useSakForslag.tsx";
import { useSaksrollerRollerData } from "./hooks/useSaksrollerRollerData.ts";
import { useSaksrollerStatus } from "./hooks/useSaksrollerStatus.ts";
import { useSaksrollerSubmit } from "./hooks/useSaksrollerSubmit.ts";
import { useSaksrollerUfullstendigRelasjon } from "./hooks/useSaksrollerUfullstendigRelasjon.ts";
import { useSakvisningSamhandlerHandling } from "./hooks/useSakvisningSamhandlerHandling.ts";
import { useUfullstendigRelasjonSjekk } from "./hooks/useUfullstendigRelasjonSjekk.ts";
import { RedigeringRegisterProvider, useHarÅpneRedigeringer } from "./RedigeringRegisterContext.tsx";
import { type BarnRolle, type SakRedigeringData, SakRedigeringSchema } from "./sakvisning-schema.ts";
import UfullstendigRelasjonAlert from "./UfullstendigRelasjonAlert.tsx";
import { ADRESSEBESKYTTELSE_ENHET, EGEN_ANSATT_ENHET } from "./utils.ts";

function sakskategoriTilVisningsnavn(kategori: "U" | "N"): string {
    return kategori === "U" ? "Utland" : "Nasjonal";
}

export interface SaksrollerVisningProps {
    saksnummer: string;
}

type SaksrollerVisningHeaderProps = {
    saksnummer: string;
    opprettetDato?: string;
    sakskategori: "U" | "N";
    sakstype: string;
    erEgenAnsatt: boolean;
    erAdressebeskyttet: boolean;
    erAvsluttet: boolean;
    erEktefellebidrag: boolean;
};

function SaksrollerVisningHeader({
    saksnummer,
    opprettetDato,
    sakskategori,
    sakstype,
    erEgenAnsatt,
    erAdressebeskyttet,
    erAvsluttet,
    erEktefellebidrag,
}: SaksrollerVisningHeaderProps) {
    return (
        <VStack gap="space-4">
            <VStack gap="space-4">
                <Heading level="1" size="large">
                    Rollebilde for sak {saksnummer}
                </Heading>
                {opprettetDato && opprettetDato.trim() !== "" && (
                    <BodyLong size="small" textColor="subtle">
                        Saken opprettet: {dateToDDMMYYYYString(new Date(opprettetDato))}
                    </BodyLong>
                )}
                <SakstypeTags
                    sakstype={sakstype}
                    sakskategoriVisningsnavn={sakskategoriTilVisningsnavn(sakskategori)}
                    erEgenAnsatt={erEgenAnsatt}
                    erAdressebeskyttet={erAdressebeskyttet}
                    erAvsluttet={erAvsluttet}
                />
            </VStack>

            {erEktefellebidrag && (
                <InfoCard data-color="info" size="small">
                    <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                        Dette er en ektefellebidragssak og inneholder ikke barn. Saken kan ikke redigeres.
                    </InfoCard.Message>
                </InfoCard>
            )}
        </VStack>
    );
}

export default function SaksrollerVisning({ saksnummer }: SaksrollerVisningProps) {
    return (
        <RedigeringRegisterProvider>
            <SaksrollerVisningInnhold saksnummer={saksnummer} />
        </RedigeringRegisterProvider>
    );
}

type SaksrollerBarnInnholdProps = {
    barn: BarnRolle[];
    roller: SakRedigeringData["roller"];
    bm: SakRedigeringData["roller"][number] | undefined;
    dataUpdatedAt: number;
    hentOgNullstillSamhandler: ComponentProps<typeof BarnVisning>["hentOgNullstillSamhandler"];
    sakstype: string;
    muligeBarn: ComponentProps<typeof LeggTilBarn>["søsken"];
    setLeggTilBarnVisSøk: (visSøk: boolean) => void;
    leggTilBarnVisSøk: boolean;
    endringsliste: Endringsrad[];
    barnMedUfullstendigRelasjon: string[];
    aktiveRoller: SakRedigeringData["roller"];
    onSubmit: () => Promise<string>;
    onRefetch: () => Promise<unknown>;
    feilmelding: string | null;
    valideringsFeil: string | null;
    harEndringer: boolean;
    suksessmelding: string | null;
    statusRef: RefObject<HTMLDivElement | null>;
    statusResetKey: number;
    funnetPersonISak: (fnr: string) => boolean;
};

function SaksrollerBarnInnhold({
    barn,
    roller,
    bm,
    dataUpdatedAt,
    hentOgNullstillSamhandler,
    sakstype,
    muligeBarn,
    setLeggTilBarnVisSøk,
    leggTilBarnVisSøk,
    endringsliste,
    barnMedUfullstendigRelasjon,
    aktiveRoller,
    onSubmit,
    onRefetch,
    feilmelding,
    valideringsFeil,
    harEndringer,
    suksessmelding,
    statusRef,
    statusResetKey,
    funnetPersonISak,
}: SaksrollerBarnInnholdProps) {
    return (
        <>
            <Box background="sunken" padding="space-12">
                <VStack gap="space-4">
                    <Heading level="2" size="small">
                        Barn i saken ({barn.length})
                    </Heading>
                    {barn.length === 0 && (
                        <InfoCard data-color="info" size="small">
                            <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                                Ingen barn registrert i saken ennå
                            </InfoCard.Message>
                        </InfoCard>
                    )}
                    <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-24" align="start">
                        {barn.map((barnRolle, idx) => (
                            <BarnVisning
                                key={barnRolle.fodselsnummer || barnRolle.objektnummer || `${barnRolle.type}-${idx}`}
                                rolle={barnRolle}
                                index={roller.indexOf(barnRolle)}
                                kanFjerneRM={!barnRolle.erMyndig && !!bm}
                                closeEditorSignal={dataUpdatedAt}
                                hentOgNullstillSamhandler={hentOgNullstillSamhandler}
                                erNyttBarn={!funnetPersonISak(barnRolle.fodselsnummer)}
                                erOppfostringsbidrag={sakstype === "Oppfostringsbidrag"}
                            />
                        ))}
                    </HGrid>
                    <LeggTilBarn
                        søsken={muligeBarn}
                        erOppfostringsbidrag={sakstype === "Oppfostringsbidrag"}
                        setVisSøk={setLeggTilBarnVisSøk}
                        visSøk={leggTilBarnVisSøk}
                    />
                </VStack>
            </Box>
            <Suspense
                fallback={
                    <Box
                        background="raised"
                        borderColor="neutral-subtleA"
                        borderWidth="1"
                        borderRadius="12"
                        padding="space-24"
                    >
                        <BodyLong size="small">Laster endringsoppsummering...</BodyLong>
                    </Box>
                }
            >
                <Endringsoppsummering endringsliste={endringsliste} />
            </Suspense>
            <VStack gap="space-12">
                <UfullstendigRelasjonAlert barnIdenter={barnMedUfullstendigRelasjon} roller={aktiveRoller} />
                <SakButtons
                    onSubmit={onSubmit}
                    onRefetch={onRefetch}
                    feilmelding={feilmelding || undefined}
                    valideringsFeil={valideringsFeil}
                    harAdvarsel={barnMedUfullstendigRelasjon.length > 0}
                    harEndringer={harEndringer}
                    suksessmelding={suksessmelding}
                    statusRef={statusRef}
                    statusResetKey={statusResetKey}
                />
            </VStack>
        </>
    );
}

function SaksrollerVisningInnhold({ saksnummer }: SaksrollerVisningProps) {
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
    const { finnBarnMedUfullstendigRelasjon } = useUfullstendigRelasjonSjekk();
    const { hentOgNullstillSamhandler } = useSakvisningSamhandlerHandling();

    const formMethods = useForm<SakRedigeringData>({
        resolver: zodResolver(SakRedigeringSchema),
        mode: "onChange",
    });

    const { reset, watch } = formMethods;
    const roller = watch("roller") || [];

    const { bp, bm, barn, barnIdenter, barnIdenterKey, aktiveRoller, sakstype, muligeBarn } = useSaksrollerRollerData({
        roller,
        berikedeRoller,
        muligeBarnPerMotpart,
    });
    const [leggTilBarnVisSøk, setLeggTilBarnVisSøk] = useState(false);
    const sakskategori = sak.kategori;

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

    const barnMedUfullstendigRelasjon = useSaksrollerUfullstendigRelasjon({
        barnIdenter,
        barnIdenterKey,
        bidragspliktigIdent: bp?.fodselsnummer,
        bidragsmottakerIdent: bm?.fodselsnummer,
        finnBarnMedUfullstendigRelasjon,
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

    return (
        <FormProvider {...formMethods}>
            <Page.Block width="2xl">
                <Box padding="space-24">
                    {isPending && (
                        <Box position="fixed" inset="space-0" className="bg-[white]/70 backdrop-blur-sm z-50">
                            <HStack align="center" justify="center" height="100%">
                                <VStack align="center" gap="space-12">
                                    <Loader size="2xlarge" title="Lagrer endringer..." />
                                    <BodyLong textColor="subtle">Lagrer endringer...</BodyLong>
                                </VStack>
                            </HStack>
                        </Box>
                    )}

                    <VStack gap="space-24">
                        <SaksrollerVisningHeader
                            saksnummer={saksnummer}
                            opprettetDato={sak.opprettetDato}
                            sakskategori={sakskategori}
                            sakstype={sakstype}
                            erEgenAnsatt={sak.eierfogd === EGEN_ANSATT_ENHET}
                            erAdressebeskyttet={sak.eierfogd === ADRESSEBESKYTTELSE_ENHET}
                            erAvsluttet={sak.avsluttet}
                            erEktefellebidrag={erEktefellebidrag}
                        />

                        <form onSubmit={(event) => event.preventDefault()} onChangeCapture={nullstillStatusmeldinger}>
                            <VStack gap="space-24">
                                <Box background="sunken" padding="space-12">
                                    <ForelderRolleVisning
                                        bp={bp}
                                        bm={bm}
                                        erNyForelderBp={
                                            bp?.fodselsnummer ? !funnetPersonISak(bp.fodselsnummer) : undefined
                                        }
                                        erNyForelderBm={
                                            bm?.fodselsnummer ? !funnetPersonISak(bm.fodselsnummer) : undefined
                                        }
                                        form={formMethods}
                                        muligeAndreForeldre={muligeAndreForeldre}
                                    />
                                </Box>

                                {!erEktefellebidrag && (
                                    <SaksrollerBarnInnhold
                                        barn={barn}
                                        roller={roller}
                                        bm={bm}
                                        dataUpdatedAt={dataUpdatedAt}
                                        hentOgNullstillSamhandler={hentOgNullstillSamhandler}
                                        sakstype={sakstype}
                                        muligeBarn={muligeBarn}
                                        setLeggTilBarnVisSøk={setLeggTilBarnVisSøk}
                                        leggTilBarnVisSøk={leggTilBarnVisSøk}
                                        endringsliste={endringsliste}
                                        barnMedUfullstendigRelasjon={barnMedUfullstendigRelasjon}
                                        aktiveRoller={aktiveRoller}
                                        onSubmit={handleSubmitAsync}
                                        onRefetch={refetch}
                                        feilmelding={feilmelding || feil}
                                        valideringsFeil={valideringsFeil}
                                        harEndringer={harEndringer}
                                        suksessmelding={suksessmelding}
                                        statusRef={statusRef}
                                        statusResetKey={statusResetKey}
                                        funnetPersonISak={funnetPersonISak}
                                    />
                                )}
                                {erEktefellebidrag && (feilmelding || feil) && (
                                    <LocalAlert status="error" ref={statusRef} tabIndex={-1}>
                                        <LocalAlert.Header>
                                            <LocalAlert.Title>{feilmelding || feil}</LocalAlert.Title>
                                        </LocalAlert.Header>
                                    </LocalAlert>
                                )}
                            </VStack>
                        </form>
                    </VStack>
                </Box>
            </Page.Block>
        </FormProvider>
    );
}
