import { TilgangsFeilError } from "@bidrag/api";
import type { OppdaterRollerISakRequest } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { dateToDDMMYYYYString } from "@bidrag/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, BodyLong, Heading, Loader, Tag, VStack } from "@navikt/ds-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { useOppdaterSaksroller } from "~/api/useApi.ts";
import type { Route } from "./+types/SaksrollerPage.ts";
import BarnVisning from "./BarnVisning.tsx";
import SakButtons from "./components/SakButtons.tsx";
import Endringsoppsummering from "./Endringsoppsummering.tsx";
import ForelderVisning from "./ForelderVisning.tsx";
import { useHentSakMedPersoninfo } from "./hooks/useHentSakMedPersoninfo.ts";
import { useSakForslag } from "./hooks/useSakForslag.tsx";
import { useSakvisningSamhandlerHandling } from "./hooks/useSakvisningSamhandlerHandling.ts";
import { useUfullstendigRelasjonSjekk } from "./hooks/useUfullstendigRelasjonSjekk.ts";
import LeggTilBarn from "./LeggTilBarn.tsx";
import LeggTilForelder from "./LeggTilForelder.tsx";
import SakErrorBoundary from "./SakErrorBoundary.tsx";
import { type BarnRolle, erBarn, type SakRedigeringData, SakRedigeringSchema } from "./sakvisning-schema.ts";
import UfullstendigRelasjonAlert from "./UfullstendigRelasjonAlert.tsx";
import { ADRESSEBESKYTTELSE_ENHET, EGEN_ANSATT_ENHET } from "./utils.ts";

type SakstypeVisning = "Barnebidrag" | "Ektefellebidrag" | "Oppfostringsbidrag" | "Farskap";

function utledSakstype(roller: SakRedigeringData["roller"]): SakstypeVisning {
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
    const [suksessmelding, setSuksessmelding] = useState<string | null>(null);
    const [visUfullstendigRelasjonMelding, setVisUfullstendigRelasjonMelding] = useState(false);

    const statusRef = useRef<HTMLDivElement>(null);
    const lastDataUpdateRef = useRef<number>(0);

    const { sak, berikedeRoller, error, harTilgang, erEktefellebidrag, refetch, dataUpdatedAt } =
        useHentSakMedPersoninfo(saksnummer);

    const oppdaterSaksrollerMutation = useOppdaterSaksroller();
    const { feil, muligeAndreForeldre, muligeBarnPerMotpart } = useSakForslag({ sak });
    const { harUfullstendigRelasjon } = useUfullstendigRelasjonSjekk();
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

    // Initialiser form med berikede roller når data er lastet eller oppdatert
    useEffect(() => {
        if (berikedeRoller.length === 0) {
            return;
        }

        if (lastDataUpdateRef.current !== dataUpdatedAt) {
            lastDataUpdateRef.current = dataUpdatedAt;
            setFeilmelding(null);
            reset({
                saksnummer,
                roller: berikedeRoller,
            });
        }
    }, [berikedeRoller, saksnummer, dataUpdatedAt, reset]);

    // Håndter feil
    useEffect(() => {
        if (error) {
            if (error instanceof TilgangsFeilError) {
                setFeilmelding(
                    "Du har ikke tilgang til denne saken. Dette kan skyldes diskresjonskode eller manglende rettigheter.",
                );
            } else {
                setFeilmelding("Kunne ikke laste sak. Vennligst prøv igjen.");
            }
        }
    }, [error]);

    // Scroll til statusmelding
    useEffect(() => {
        if ((feilmelding || suksessmelding) && statusRef.current) {
            statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            statusRef.current.focus();
        }
    }, [feilmelding, suksessmelding]);

    // Sjekk ufullstendig relasjon
    useEffect(() => {
        async function sjekkUfullstendigRelasjon() {
            if (sak && barnIdenter.length > 0) {
                const harUfullstendig = await harUfullstendigRelasjon(
                    barnIdenter,
                    bm?.fodselsnummer,
                    bp?.fodselsnummer,
                );
                setVisUfullstendigRelasjonMelding(harUfullstendig);
            }
        }
        sjekkUfullstendigRelasjon();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bp?.fodselsnummer, bm?.fodselsnummer, barnIdenterKey, sak, harUfullstendigRelasjon]);

    const onSubmit = async (data: SakRedigeringData): Promise<string> => {
        try {
            setSuksessmelding(null);
            setFeilmelding(null);

            const request: OppdaterRollerISakRequest = {
                saksnummer: data.saksnummer,
                roller: data.roller.map((rolle) => {
                    const barnRolle = rolle as BarnRolle;
                    const bidragSakRolle =
                        rolle.rolleType === "BP"
                            ? Rolletype.BP
                            : rolle.rolleType === "BM"
                              ? Rolletype.BM
                              : Rolletype.BA;
                    return {
                        fodselsnummer: rolle.fodselsnummer || "",
                        type: bidragSakRolle,
                        objektnummer: rolle.objektnummer || "",
                        reellMottaker:
                            rolle.rolleType === "BA" && barnRolle?.reellMottaker
                                ? { ident: barnRolle.reellMottaker || "", verge: false }
                                : null,
                        mottagerErVerge: false,
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
                    reject(new Error("Validation failed", { cause: e }));
                },
            )();
        });
    }

    if (!harTilgang) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <Alert variant="error">
                    <Heading level="3" size="small" spacing>
                        Ingen tilgang
                    </Heading>
                    <BodyLong spacing>
                        Du har ikke tilgang til sak {saksnummer}. Dette kan skyldes diskresjonskode eller manglende
                        rettigheter.
                    </BodyLong>
                </Alert>
            </div>
        );
    }

    const funnetPersonISak = (fnr: string) => sak.roller.some((r) => r.fodselsnummer === fnr);

    const bmEllerBpErUkjent = useMemo(
        () => sak.roller.filter((r) => [Rolletype.BM, Rolletype.BP].includes(r.type)).length < 2,
        [sak.roller],
    );

    return (
        <FormProvider {...formMethods}>
            <div className="max-w-5xl mx-auto">
                <div className="min-h-screen bg-ax-neutral-100 p-6">
                    {oppdaterSaksrollerMutation.isPending && (
                        <div className="fixed inset-0 bg-[white]/70 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader size="2xlarge" title="Lagrer endringer..." />
                                <BodyLong className="text-ax-neutral-800">Lagrer endringer...</BodyLong>
                            </div>
                        </div>
                    )}

                    <VStack gap="space-6">
                        <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                            <VStack gap="space-4">
                                <div className="border-b border-ax-neutral-300 pb-4">
                                    <Heading level="1" size="large" className="mb-2">
                                        Sak {saksnummer}
                                    </Heading>
                                    {sak?.opprettetDato?.trim() !== "" && (
                                        <BodyLong size="small" className="text-ax-neutral-800 mb-3">
                                            Saken opprettet: {dateToDDMMYYYYString(new Date(sak.opprettetDato))}
                                        </BodyLong>
                                    )}
                                    <div className="flex flex-wrap gap-2">
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
                                    </div>
                                </div>

                                {erEktefellebidrag && (
                                    <Alert variant="info" size="small">
                                        Dette er en ektefellebidragssak og inneholder ikke barn. Saken kan ikke
                                        redigeres.
                                    </Alert>
                                )}

                                {(feilmelding || feil) && (
                                    <Alert variant="error" ref={statusRef} tabIndex={-1}>
                                        {feilmelding || feil}
                                    </Alert>
                                )}
                            </VStack>
                        </div>

                        <form>
                            <VStack gap="space-6">
                                <div className={`grid grid-cols-1 ${!bmEllerBpErUkjent ? "sm:grid-cols-2" : ""} gap-6`}>
                                    <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                        <VStack gap="space-4">
                                            <Heading level="2" size="medium">
                                                Bidragspliktig
                                            </Heading>
                                            {bp?.fodselsnummer ? (
                                                <ForelderVisning
                                                    form={formMethods}
                                                    rolle={bp}
                                                    erNyForelder={!funnetPersonISak(bp.fodselsnummer)}
                                                />
                                            ) : (
                                                <LeggTilForelder
                                                    rolleType="BP"
                                                    rolleNavn="Bidragspliktig"
                                                    form={formMethods}
                                                    muligeAndreForeldre={muligeAndreForeldre}
                                                />
                                            )}
                                        </VStack>
                                    </div>

                                    <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                        <VStack gap="space-4">
                                            <Heading level="2" size="medium">
                                                Bidragsmottaker
                                            </Heading>
                                            {bm?.fodselsnummer ? (
                                                <ForelderVisning
                                                    form={formMethods}
                                                    rolle={bm}
                                                    erNyForelder={!funnetPersonISak(bm.fodselsnummer)}
                                                />
                                            ) : (
                                                <LeggTilForelder
                                                    rolleType="BM"
                                                    rolleNavn="Bidragsmottaker"
                                                    form={formMethods}
                                                    muligeAndreForeldre={muligeAndreForeldre}
                                                />
                                            )}
                                        </VStack>
                                    </div>
                                </div>

                                {!erEktefellebidrag && (
                                    <>
                                        <UfullstendigRelasjonAlert visAlert={visUfullstendigRelasjonMelding} />

                                        <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                            <VStack gap="space-4">
                                                <div
                                                    className={`flex ${leggTilBarnVisSøk ? "flex-col" : "flex-row"} gap-3 ${leggTilBarnVisSøk ? "items-start" : "items-center"} justify-between flex-wrap`}
                                                >
                                                    <Heading level="2" size="medium" className="flex-1 min-w-0">
                                                        Barn i saken ({barn.length})
                                                    </Heading>
                                                    <div
                                                        className={leggTilBarnVisSøk ? "shrink-0 mt-2 md:mt-0" : "mt-3"}
                                                    >
                                                        <LeggTilBarn
                                                            søsken={muligeBarn}
                                                            setVisSøk={setLeggTilBarnVisSøk}
                                                            visSøk={leggTilBarnVisSøk}
                                                            hentOgNullstillSamhandler={hentOgNullstillSamhandler}
                                                            erOppfostringsbidrag={sakstype === "Oppfostringsbidrag"}
                                                        />
                                                    </div>
                                                </div>

                                                {barn.length === 0 ? (
                                                    <Alert variant="info">Ingen barn registrert i saken ennå</Alert>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
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
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </VStack>
                                        </div>

                                        <Suspense
                                            fallback={
                                                <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                                    <BodyLong size="small">Laster endringsoppsummering...</BodyLong>
                                                </div>
                                            }
                                        >
                                            <Endringsoppsummering
                                                opprinneligeRoller={berikedeRoller}
                                                nåværendeRoller={aktiveRoller}
                                            />
                                        </Suspense>

                                        <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                            <SakButtons onSubmit={handleSubmitAsync} onRefetch={refetch} />
                                        </div>
                                    </>
                                )}

                                {suksessmelding && (
                                    <Alert variant="success" ref={statusRef} tabIndex={-1}>
                                        {suksessmelding}
                                    </Alert>
                                )}
                            </VStack>
                        </form>
                    </VStack>
                </div>
            </div>
        </FormProvider>
    );
}

export default function SaksrollerPage({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;

    return (
        <SakErrorBoundary saksnummer={saksnummer}>
            <Suspense
                fallback={
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="flex flex-col items-center gap-3">
                            <Loader size="2xlarge" title="Laster sak..." />
                            <BodyLong>Laster sak</BodyLong>
                        </div>
                    </div>
                }
            >
                <SakvisningContent saksnummer={saksnummer} />
            </Suspense>
        </SakErrorBoundary>
    );
}
