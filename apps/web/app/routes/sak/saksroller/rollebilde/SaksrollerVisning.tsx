import { dateToDDMMYYYYString } from "@bidrag/common";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Heading, HGrid, HStack, InfoCard, Loader, LocalAlert, Page, VStack } from "@navikt/ds-react";
import { Suspense } from "react";
import { FormProvider } from "react-hook-form";
import type { SakRedigeringData } from "../felles/sakvisning-schema.ts";
import { ADRESSEBESKYTTELSE_ENHET, EGEN_ANSATT_ENHET } from "../felles/utils.ts";
import BarnISaken from "./barn/BarnISaken.tsx";
import Endringsoppsummering from "./endringer/Endringsoppsummering.tsx";
import type { Endringsrad } from "./endringer/endringsoppsummering-utils.ts";
import ForelderRolleVisning from "./forelder/ForelderRolleVisning.tsx";
import { useSaksrollerVisning } from "./hooks/useSaksrollerVisning.ts";
import { RedigeringRegisterProvider } from "./RedigeringRegisterContext.tsx";
import SakButtons, { type SakButtonsProps } from "./SakButtons.tsx";
import { SakstypeTags } from "./SakstypeTags.tsx";
import UfullstendigRelasjonAlert from "./UfullstendigRelasjonAlert.tsx";

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
                                            bidragsmottakerIdent={bm?.fodselsnummer || undefined}
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
