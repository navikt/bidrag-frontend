import { dateToDDMMYYYYString } from "@bidrag/common";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Heading, HGrid, HStack, InfoCard, Loader, LocalAlert, Page, VStack } from "@navikt/ds-react";
import { type ComponentProps, Suspense, useState } from "react";
import { FormProvider } from "react-hook-form";

import BarnVisning from "./barn-rolle/BarnVisning.tsx";
import LeggTilBarn from "./barn-rolle/LeggTilBarn.tsx";
import SakButtons, { type SakButtonsProps } from "./components/SakButtons.tsx";
import Endringsoppsummering from "./Endringsoppsummering.tsx";
import type { Endringsrad } from "./endringsoppsummering-utils.ts";
import { SakstypeTags } from "./felles/SakstypeTags.tsx";
import ForelderRolleVisning from "./forelder-rolle/ForelderRolleVisning.tsx";
import { useSaksrollerVisning } from "./hooks/useSaksrollerVisning.ts";
import { RedigeringRegisterProvider } from "./RedigeringRegisterContext.tsx";
import type { BarnRolle, SakRedigeringData } from "./sakvisning-schema.ts";
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

function barnnøkkel(barnRolle: BarnRolle, idx: number) {
    return barnRolle.fodselsnummer || barnRolle.objektnummer || `${barnRolle.type}-${idx}`;
}

function IngenBarnMelding() {
    return (
        <InfoCard data-color="info" size="small">
            <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                Ingen barn registrert i saken ennå
            </InfoCard.Message>
        </InfoCard>
    );
}

function LagrerOverlay() {
    return (
        <Box position="fixed" inset="space-0" className="bg-[white]/70 backdrop-blur-sm z-50">
            <HStack align="center" justify="center" height="100%">
                <VStack align="center" gap="space-12">
                    <Loader size="2xlarge" title="Lagrer endringer..." />
                    <BodyLong textColor="subtle">Lagrer endringer...</BodyLong>
                </VStack>
            </HStack>
        </Box>
    );
}

type BarnISakenProps = {
    barn: BarnRolle[];
    roller: SakRedigeringData["roller"];
    harBm: boolean;
    dataUpdatedAt: number;
    hentOgNullstillSamhandler: ComponentProps<typeof BarnVisning>["hentOgNullstillSamhandler"];
    erOppfostringsbidrag: boolean;
    muligeBarn: ComponentProps<typeof LeggTilBarn>["søsken"];
    funnetPersonISak: (fnr: string) => boolean;
};

function BarnISaken({
    barn,
    roller,
    harBm,
    dataUpdatedAt,
    hentOgNullstillSamhandler,
    erOppfostringsbidrag,
    muligeBarn,
    funnetPersonISak,
}: BarnISakenProps) {
    const [visSøk, setVisSøk] = useState(false);

    return (
        <Box background="sunken" padding="space-12">
            <VStack gap="space-4">
                <Heading level="2" size="small">
                    Barn i saken ({barn.length})
                </Heading>
                {barn.length === 0 && <IngenBarnMelding />}
                <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-24" align="start">
                    {barn.map((barnRolle, idx) => (
                        <BarnVisning
                            key={barnnøkkel(barnRolle, idx)}
                            rolle={barnRolle}
                            index={roller.indexOf(barnRolle)}
                            kanFjerneRM={!barnRolle.erMyndig && harBm}
                            closeEditorSignal={dataUpdatedAt}
                            hentOgNullstillSamhandler={hentOgNullstillSamhandler}
                            erNyttBarn={!funnetPersonISak(barnRolle.fodselsnummer)}
                            erOppfostringsbidrag={erOppfostringsbidrag}
                        />
                    ))}
                </HGrid>
                <LeggTilBarn
                    søsken={muligeBarn}
                    erOppfostringsbidrag={erOppfostringsbidrag}
                    setVisSøk={setVisSøk}
                    visSøk={visSøk}
                />
            </VStack>
        </Box>
    );
}

function EndringerOgLagring({
    endringsliste,
    barnMedUfullstendigRelasjon,
    aktiveRoller,
    sakButtons,
}: {
    endringsliste: Endringsrad[];
    barnMedUfullstendigRelasjon: string[];
    aktiveRoller: SakRedigeringData["roller"];
    sakButtons: SakButtonsProps;
}) {
    return (
        <>
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
                <SakButtons {...sakButtons} />
            </VStack>
        </>
    );
}

function SaksrollerVisningInnhold({ saksnummer }: SaksrollerVisningProps) {
    const visning = useSaksrollerVisning(saksnummer);
    const { sak, erEktefellebidrag, formMethods, bp, bm, samletFeilmelding } = visning;

    return (
        <FormProvider {...formMethods}>
            <Page.Block width="2xl">
                <Box padding="space-24">
                    {visning.isPending && <LagrerOverlay />}

                    <VStack gap="space-24">
                        <SaksrollerVisningHeader
                            saksnummer={saksnummer}
                            opprettetDato={sak.opprettetDato}
                            sakskategori={sak.kategori}
                            sakstype={visning.sakstype}
                            erEgenAnsatt={sak.eierfogd === EGEN_ANSATT_ENHET}
                            erAdressebeskyttet={sak.eierfogd === ADRESSEBESKYTTELSE_ENHET}
                            erAvsluttet={sak.avsluttet}
                            erEktefellebidrag={erEktefellebidrag}
                        />

                        <form
                            onSubmit={(event) => event.preventDefault()}
                            onChangeCapture={visning.nullstillStatusmeldinger}
                        >
                            <VStack gap="space-24">
                                <Box background="sunken" padding="space-12">
                                    <ForelderRolleVisning
                                        bp={bp}
                                        bm={bm}
                                        erNyForelderBp={visning.erNyPerson(bp?.fodselsnummer)}
                                        erNyForelderBm={visning.erNyPerson(bm?.fodselsnummer)}
                                        form={formMethods}
                                        muligeAndreForeldre={visning.muligeAndreForeldre}
                                    />
                                </Box>

                                {erEktefellebidrag ? (
                                    samletFeilmelding && (
                                        <LocalAlert status="error" ref={visning.statusRef} tabIndex={-1}>
                                            <LocalAlert.Header>
                                                <LocalAlert.Title>{samletFeilmelding}</LocalAlert.Title>
                                            </LocalAlert.Header>
                                        </LocalAlert>
                                    )
                                ) : (
                                    <>
                                        <BarnISaken
                                            barn={visning.barn}
                                            roller={visning.roller}
                                            harBm={!!bm}
                                            dataUpdatedAt={visning.dataUpdatedAt}
                                            hentOgNullstillSamhandler={visning.hentOgNullstillSamhandler}
                                            erOppfostringsbidrag={visning.sakstype === "Oppfostringsbidrag"}
                                            muligeBarn={visning.muligeBarn}
                                            funnetPersonISak={visning.funnetPersonISak}
                                        />
                                        <EndringerOgLagring
                                            endringsliste={visning.endringsliste}
                                            barnMedUfullstendigRelasjon={visning.barnMedUfullstendigRelasjon}
                                            aktiveRoller={visning.aktiveRoller}
                                            sakButtons={visning.sakButtons}
                                        />
                                    </>
                                )}
                            </VStack>
                        </form>
                    </VStack>
                </Box>
            </Page.Block>
        </FormProvider>
    );
}
