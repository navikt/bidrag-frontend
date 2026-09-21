import type { OppdaterRollerISakRequest } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { dateToDDMMYYYYString } from "@bidrag/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, BodyLong, Box, Heading, HGrid, HStack, Loader, Page, Tag, VStack } from "@navikt/ds-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";

import { useOppdaterSaksroller } from "~/api/useApi.ts";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel";
import type { Route } from "./+types/SaksrollerPage.ts";
import BarnVisning from "./BarnVisning.tsx";
import SakButtons from "./components/SakButtons.tsx";
import Endringsoppsummering from "./Endringsoppsummering.tsx";
import ForelderRolleVisning from "./forelder-rolle/ForelderRolleVisning.tsx";
import { useEndringssporing } from "./hooks/useEndringssporing.ts";
import { useHentSakMedPersoninfo } from "./hooks/useHentSakMedPersoninfo.ts";
import { useSakForslag } from "./hooks/useSakForslag.tsx";
import { useSakvisningSamhandlerHandling } from "./hooks/useSakvisningSamhandlerHandling.ts";
import { useUfullstendigRelasjonSjekk } from "./hooks/useUfullstendigRelasjonSjekk.ts";
import LeggTilBarn from "./LeggTilBarn.tsx";
import SakErrorBoundary from "./SakErrorBoundary.tsx";
import { type BarnRolle, erBarn, type SakRedigeringData, SakRedigeringSchema } from "./sakvisning-schema.ts";
import UfullstendigRelasjonAlert from "./UfullstendigRelasjonAlert.tsx";
import { ADRESSEBESKYTTELSE_ENHET, EGEN_ANSATT_ENHET } from "./utils.ts";

export type SakstypeVisning = "Barnebidrag" | "Ektefellebidrag" | "Oppfostringsbidrag" | "Farskap";

export const handle: SakSideTittelHandle = { sakSideTittel: "Saksroller" };

export function finnFørsteValideringsfeil(feil: FieldErrors<SakRedigeringData>): string | undefined {
    const verdier: unknown[] = [feil];

    while (verdier.length > 0) {
        const verdi = verdier.shift();
        if (!verdi || typeof verdi !== "object") {
            continue;
        }

        if ("message" in verdi && typeof verdi.message === "string" && "type" in verdi && verdi.type === "custom") {
            return verdi.message;
        }

        verdier.push(...Object.values(verdi));
    }
}

export function utledSakstype(roller: SakRedigeringData["roller"]): SakstypeVisning {
    const harBarn = roller.some((r) => r.type === "BA");
    const harBP = roller.some((r) => r.type === "BP");
    const harBM = roller.some((r) => r.type === "BM");

    if (!harBarn && harBP && harBM) return "Ektefellebidrag";
    if (harBarn && harBP && !harBM) return "Oppfostringsbidrag";
    if (harBarn && !harBP && harBM) return "Farskap";
    return "Barnebidrag";
}

function sakskategoriTilVisningsnavn(kategori: "U" | "N"): string {
    return kategori === "U" ? "Utland" : "Nasjonal";
}

interface SakvisningProps {
    saksnummer: string;
}

function SakvisningContent({ saksnummer }: SakvisningProps) {
    const [feilmelding, setFeilmelding] = useState<string | null>(null);
    const [valideringsFeil, setValideringsFeil] = useState<string | null>(null);
    const [suksessmelding, setSuksessmelding] = useState<string | null>(null);
    const [barnMedUfullstendigRelasjon, setBarnMedUfullstendigRelasjon] = useState<string[]>([]);

    const statusRef = useRef<HTMLDivElement>(null);
    const lastDataUpdateRef = useRef<number>(0);

    const { sak, berikedeRoller, erEktefellebidrag, refetch, dataUpdatedAt } = useHentSakMedPersoninfo(saksnummer);

    const oppdaterSaksrollerMutation = useOppdaterSaksroller();
    const { feil, muligeAndreForeldre, muligeBarnPerMotpart } = useSakForslag({ sak });
    const { finnBarnMedUfullstendigRelasjon } = useUfullstendigRelasjonSjekk();
    const { hentOgNullstillSamhandler } = useSakvisningSamhandlerHandling();

    const formMethods = useForm<SakRedigeringData>({
        resolver: zodResolver(SakRedigeringSchema),
        mode: "onChange",
    });

    const { reset, watch, handleSubmit } = formMethods;
    const roller = watch("roller") || [];

    const bp = useMemo(() => roller.find((r) => r.type === "BP"), [roller]);
    const bm = useMemo(() => roller.find((r) => r.type === "BM"), [roller]);
    const barn = roller.filter(erBarn) as BarnRolle[];
    const barnIdenter = useMemo(() => barn.map((b) => b.fodselsnummer), [barn]);
    const barnIdenterKey = barnIdenter.join(",");
    const [leggTilBarnVisSøk, setLeggTilBarnVisSøk] = useState(false);
    const aktiveRoller = useMemo(() => (roller.length > 0 ? roller : berikedeRoller), [roller, berikedeRoller]);

    const sakstype = useMemo(() => utledSakstype(aktiveRoller), [aktiveRoller]);
    const sakskategori = sak.kategori;

    const muligeBarn =
        bp || bm
            ? (muligeBarnPerMotpart.get(bp?.fodselsnummer ?? "") ??
              muligeBarnPerMotpart.get(bm?.fodselsnummer ?? "") ??
              [])
            : [];

    const { endringsliste, harEndringer } = useEndringssporing({
        opprinneligeRoller: berikedeRoller,
        nåværendeRoller: aktiveRoller,
        barnMedUfullstendigRelasjon,
        dataOppdatertNøkkel: dataUpdatedAt,
        onNyEndring: () => {
            setFeilmelding(null);
            setValideringsFeil(null);
            setSuksessmelding(null);
        },
    });

    function initialiserFormMedBerikedeRoller() {
        if (berikedeRoller.length === 0) {
            return;
        }

        if (lastDataUpdateRef.current !== dataUpdatedAt) {
            lastDataUpdateRef.current = dataUpdatedAt;
            setFeilmelding(null);
            setValideringsFeil(null);
            reset({
                saksnummer,
                roller: berikedeRoller,
            });
        }
    }

    useEffect(initialiserFormMedBerikedeRoller, [berikedeRoller, saksnummer, dataUpdatedAt, reset]);

    function scrollTilStatusmelding() {
        if ((feilmelding || suksessmelding) && statusRef.current) {
            statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            statusRef.current.focus();
        }
    }

    useEffect(scrollTilStatusmelding, [feilmelding, suksessmelding]);

    useEffect(() => {
        async function sjekkUfullstendigRelasjon() {
            if (!sak || barnIdenter.length === 0) {
                setBarnMedUfullstendigRelasjon([]);
                return;
            }
            setBarnMedUfullstendigRelasjon(
                await finnBarnMedUfullstendigRelasjon(barnIdenter, bm?.fodselsnummer, bp?.fodselsnummer),
            );
        }
        sjekkUfullstendigRelasjon();
    }, [bp?.fodselsnummer, bm?.fodselsnummer, barnIdenterKey, sak, finnBarnMedUfullstendigRelasjon]);

    const onSubmit = async (data: SakRedigeringData): Promise<string> => {
        try {
            setSuksessmelding(null);
            setFeilmelding(null);
            setValideringsFeil(null);

            const request: OppdaterRollerISakRequest = {
                saksnummer: data.saksnummer,
                roller: data.roller.map((rolle) => {
                    const barnRolle = rolle as BarnRolle;
                    const bidragSakRolle = {
                        BA: Rolletype.BA,
                        BM: Rolletype.BM,
                        BP: Rolletype.BP,
                        RM: Rolletype.RM,
                    }[rolle.rolleType];
                    return {
                        fodselsnummer: rolle.fodselsnummer || "",
                        type: bidragSakRolle,
                        objektnummer: rolle.objektnummer || "",
                        reellMottaker:
                            rolle.rolleType === "BA" && barnRolle?.reellMottaker
                                ? { ident: barnRolle.reellMottaker || "", verge: false }
                                : null,
                        mottagerErVerge: rolle.mottagerErVerge,
                        rolleType: bidragSakRolle,
                        rollehistorikk: [],
                    };
                }),
            };

            oppdaterSaksrollerMutation.reset();

            await oppdaterSaksrollerMutation.mutateAsync(request);
            setSuksessmelding("Saken ble oppdatert");
            return saksnummer;
        } catch (err) {
            const axiosError = err as { response?: { data?: string } };
            setFeilmelding(axiosError?.response?.data || "Kunne ikke oppdatere sak. Vennligst prøv igjen.");
            throw err;
        }
    };

    function handleSubmitAsync() {
        return new Promise<string>((resolve, reject) => {
            handleSubmit(
                async (data) => {
                    try {
                        resolve(await onSubmit(data));
                    } catch (error) {
                        reject(error);
                    }
                },
                (e) => {
                    setValideringsFeil(
                        finnFørsteValideringsfeil(e) ??
                            "Kan ikke lagre saken. Kontroller feltene som er markert med feil.",
                    );
                    reject(new Error("Validation failed", { cause: e }));
                },
            )();
        });
    }

    const funnetPersonISak = (fnr: string) => sak.roller.some((r) => r.fodselsnummer === fnr);

    return (
        <FormProvider {...formMethods}>
            <Page.Block width="xl">
                <Box padding="space-24">
                    {oppdaterSaksrollerMutation.isPending && (
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
                        <VStack gap="space-4">
                            <VStack gap="space-4">
                                <Heading level="1" size="large">
                                    Rollebilde for sak {saksnummer}
                                </Heading>
                                {sak?.opprettetDato?.trim() !== "" && (
                                    <BodyLong size="small" textColor="subtle">
                                        Saken opprettet: {dateToDDMMYYYYString(new Date(sak.opprettetDato))}
                                    </BodyLong>
                                )}
                                <HStack gap="space-8" wrap>
                                    <Tag size="small" variant="info">
                                        {sakstype}
                                    </Tag>
                                    <Tag size="small" variant="info">
                                        {sakskategoriTilVisningsnavn(sakskategori)}
                                    </Tag>
                                    {sak.eierfogd === EGEN_ANSATT_ENHET && (
                                        <Tag size="small" variant="warning">
                                            Egen ansatt
                                        </Tag>
                                    )}
                                    {sak.eierfogd === ADRESSEBESKYTTELSE_ENHET && (
                                        <Tag size="small" variant="warning">
                                            Adressebeskyttelse
                                        </Tag>
                                    )}
                                    {sak.avsluttet && (
                                        <Tag size="small" variant="error">
                                            Avsluttet sak
                                        </Tag>
                                    )}
                                </HStack>
                            </VStack>

                            {erEktefellebidrag && (
                                <Alert variant="info" size="small">
                                    Dette er en ektefellebidragssak og inneholder ikke barn. Saken kan ikke redigeres.
                                </Alert>
                            )}

                            {(feilmelding || feil) && (
                                <Alert variant="error" ref={statusRef} tabIndex={-1}>
                                    {feilmelding || feil}
                                </Alert>
                            )}
                        </VStack>

                        <form onSubmit={(event) => event.preventDefault()}>
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
                                        saksnummer={saksnummer}
                                    />
                                </Box>

                                {!erEktefellebidrag && (
                                    <>
                                        <Box background="sunken" padding="space-12">
                                            <VStack gap="space-4">
                                                <Heading level="2" size="small">
                                                    Barn i saken ({barn.length})
                                                </Heading>

                                                {barn.length === 0 ? (
                                                    <Alert variant="info">Ingen barn registrert i saken ennå</Alert>
                                                ) : (
                                                    <HGrid
                                                        columns={{ xs: 1, md: 2, lg: 3 }}
                                                        gap="space-24"
                                                        align="start"
                                                    >
                                                        {barn.map((barnRolle, idx) => (
                                                            <BarnVisning
                                                                key={
                                                                    barnRolle.fodselsnummer ||
                                                                    barnRolle.objektnummer ||
                                                                    `${barnRolle.type}-${idx}`
                                                                }
                                                                rolle={barnRolle}
                                                                index={roller.indexOf(barnRolle)}
                                                                kanFjerneRM={!barnRolle.erMyndig && !!bm}
                                                                closeEditorSignal={dataUpdatedAt}
                                                                hentOgNullstillSamhandler={hentOgNullstillSamhandler}
                                                                erNyttBarn={!funnetPersonISak(barnRolle.fodselsnummer)}
                                                                erOppfostringsbidrag={sakstype === "Oppfostringsbidrag"}
                                                                saksnummer={saksnummer}
                                                            />
                                                        ))}
                                                    </HGrid>
                                                )}

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
                                            <UfullstendigRelasjonAlert
                                                barnIdenter={barnMedUfullstendigRelasjon}
                                                roller={aktiveRoller}
                                            />
                                            <SakButtons
                                                onSubmit={handleSubmitAsync}
                                                onRefetch={refetch}
                                                feilmelding={feilmelding}
                                                valideringsFeil={valideringsFeil}
                                                harAdvarsel={barnMedUfullstendigRelasjon.length > 0}
                                                harEndringer={harEndringer}
                                                suksessmelding={suksessmelding}
                                                statusRef={statusRef}
                                            />
                                        </VStack>
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

export default function SaksrollerPage({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;
    const tabTitle = `Saksroller - ${saksnummer}`;

    return (
        <>
            <title>{tabTitle}</title>
            <SakErrorBoundary saksnummer={saksnummer}>
                <Suspense
                    fallback={
                        <VStack align="center" justify="center" gap="space-12" minHeight="100vh">
                            <Loader size="2xlarge" title="Laster sak..." />
                            <BodyLong>Laster sak</BodyLong>
                        </VStack>
                    }
                >
                    <SakvisningContent saksnummer={saksnummer} />
                </Suspense>
            </SakErrorBoundary>
        </>
    );
}
