import { TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, BodyShort, Box, Heading, VStack } from "@navikt/ds-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useHentForeldreinformasjonForBarn, useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import BarnManueltRegistrering from "../BarnManueltRegistrering";
import LasterSkeleton from "../components/LasterSkeleton";
import { useFlowSubmission } from "../hooks/useFlowSubmission";
import { useMotpartHandling } from "../hooks/useMotpartHandling";
import useSyncKategori from "../hooks/useSyncKategori";
import MotpartVelger from "../motpart-felles/MotpartVelger";
import ValgteBarnListe from "../motpart-felles/ValgteBarnListe";
import {
    type BarnMedAlder,
    type ForelderPartRolle,
    type ForelderUtenBarnSkjemaData,
    ForelderUtenBarnSkjemaSchema,
    MAKS_ALDER_BARN,
    MYNDYG_BARN_ALDER,
} from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import EksisterendeSakSection from "../sections/EksisterendeSakSection";
import EnhetOgSubmitSection from "../sections/EnhetOgSubmitSection";
import MotpartSection from "../sections/MotpartSection";
import ValideringsAlertsSection from "../sections/ValideringsAlertsSection";
import { hentMotsattRolle } from "../utils";
import FlereForeslåttMotpartVelger from "./FlereForeslåttMotpartVelger";
import SøskenListe from "./SøskenListe";

export type ForeslåttForelder = {
    barnIdent: string;
    barnNavn: string;
} & PersonDto;

export default function ForelderUtenBarnFlyt() {
    const { partISaken, saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    if (!partISaken || !saksrolleFlyt || saksrolleFlyt.type !== "FORELDER_UTEN_BARN") {
        return null;
    }

    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);

    const form = useForm<ForelderUtenBarnSkjemaData>({
        resolver: zodResolver(ForelderUtenBarnSkjemaSchema),
        defaultValues: {
            partISaken: partISaken,
            valgteBarn: [],
            motpart: {
                erKjent: false,
                rolle: motsattRolle,
            },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    return (
        <FormProvider {...form}>
            <ForelderUtenBarnFlytContent />
        </FormProvider>
    );
}

function ForelderUtenBarnFlytContent() {
    const { partISaken } = useSaksrolleroversikt();
    if (!partISaken) {
        return null;
    }

    const form = useFormContext<ForelderUtenBarnSkjemaData>();
    useSyncKategori(form);
    const [søkteBarn, settSøkteBarn] = useState<PersonDto | null>(null);
    const [feil, settFeil] = useState<string>("");
    const [infoMelding, settInfoMelding] = useState<string>("");
    const [foreslåttMotpart, settForeslåttMotpart] = useState<ForeslåttForelder[]>([]);
    const [søsken, settSøsken] = useState<BarnMedAlder[]>([]);
    const [motpartErManueltValgt, settMotpartErManueltValgt] = useState(false);
    const [motpartIdentForSøskenSøk, settMotpartIdentForSøskenSøk] = useState<string | null>(null);
    const bidragsmottakerRegistreringRef = useRef<HTMLDialogElement>(null);
    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);

    useEffect(() => {
        form.setValue("partISaken.rolle", partISaken.rolle);
    }, [partISaken.rolle]);

    const valgteBarn = form.watch("valgteBarn");
    const motpart = form.watch("motpart");

    const erBidragspliktig = partISaken.rolle === "bidragspliktig";
    const erBidragsmottaker = partISaken.rolle === "bidragsmottaker";
    const bidragsmottaker = erBidragsmottaker ? partISaken : motpart;
    const bidragspliktig = erBidragspliktig ? partISaken : motpart;
    const normalisertMotpart = {
        ident: motpart.ident ?? "",
        navn: motpart.navn ?? "",
        rolle: motpart.rolle ?? motsattRolle,
        erKjent: motpart.erKjent,
    };

    const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker.erKjent;

    const { data: foreldreinformasjonTilBarn, error: foreldreinformasjonTilBarnError } =
        useHentForeldreinformasjonForBarn(søkteBarn ? { ident: søkteBarn.ident } : null, søkteBarn !== null);

    const { data: motpartBarnRelasjon } = useHentPersonMotpartBarnRelasjon(
        motpartIdentForSøskenSøk ? { ident: motpartIdentForSøskenSøk } : null,
        !!motpartIdentForSøskenSøk,
    );

    const { settMotpartUkjent: settMotpartUkjentBase, leggTilMotpartManuell } = useMotpartHandling(form);

    const {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        harEksisterendeSak,
        eksisterendeSak,
        isLoadingHentSak,
        infoMelding: eksisterendeSakInfoMelding,
        onSubmit,
        error,
        saksnummer,
    } = useFlowSubmission({
        form,
        partISaken: { ...form.watch("partISaken"), erKjent: true },
        motpart: normalisertMotpart,
        valgteBarn,
        bidragspliktig,
        bidragsmottaker,
        eksisterendeSakPartISaken: { ...form.watch("partISaken"), erKjent: true },
        eksisterendeSakMotpart: normalisertMotpart,
    });

    useEffect(() => {
        if (!motpartBarnRelasjon || valgteBarn.length > 0) {
            return;
        }

        try {
            const relasjonerMedAlleBarn = motpartBarnRelasjon.personensMotpartBarnRelasjon.filter((relasjon) => {
                const barnIRelasjon = relasjon.fellesBarn.map((b) => b.ident);
                return valgteBarn.every((b) => barnIRelasjon.includes(b.ident));
            });

            const søskenMedAlder: BarnMedAlder[] = relasjonerMedAlleBarn
                .flatMap((x) => x.fellesBarn)
                .flatMap((enkeltBarn) => {
                    const alder = enkeltBarn?.fødselsdato
                        ? beregnAlder(enkeltBarn.fødselsdato)
                        : beregnAlderFraFnr(enkeltBarn.ident);

                    if (
                        alder === null ||
                        valgteBarn.some((b) => b.ident === enkeltBarn.ident) ||
                        alder > MAKS_ALDER_BARN
                    ) {
                        return [];
                    }

                    return [
                        {
                            ident: enkeltBarn.ident,
                            navn: enkeltBarn.visningsnavn,
                            fødselsdato: formaterDato(enkeltBarn.fødselsdato),
                            alder,
                            erMyndig: alder >= MYNDYG_BARN_ALDER,
                        },
                    ];
                });

            settSøsken(søskenMedAlder);

            settMotpartIdentForSøskenSøk(null);
        } catch (error) {
            SecureLoggerService.warn(
                "Feil ved prosessering av søsken:",
                error instanceof Error ? error : new Error(String(error)),
            );
            settSøsken([]);
        }
    }, [motpartBarnRelasjon, valgteBarn]);

    useEffect(() => {
        const handleForeldreinformasjon = async () => {
            if (!foreldreinformasjonTilBarn || !søkteBarn) {
                return;
            }

            try {
                if (foreldreinformasjonTilBarn.length > 2) {
                    settFeil(
                        `Dette barnet (${søkteBarn.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`,
                    );
                    return;
                }

                if (foreldreinformasjonTilBarn.length === 2) {
                    settFeil(
                        `Er du sikker på at dette er riktig barn? Dette barnet (${søkteBarn.ident}) har begge foreldre registrert, men ${partISaken.navn} (${partISaken.ident}) har ingen barn registrert.`,
                    );
                    return;
                }

                const motpartFunnet = foreldreinformasjonTilBarn.find((f) => f.ident !== partISaken.ident);

                if (motpartErManueltValgt && motpartFunnet && motpartFunnet.ident !== motpart?.ident) {
                    settInfoMelding(
                        `Merk: Dette barnet (${søkteBarn.ident}) har ${motpartFunnet.visningsnavn} som forelder, men du har allerede valgt ${motpart.navn} som motpart. Motparten endres ikke.`,
                    );
                }

                if (motpartFunnet) {
                    const nyForeslåttForelder: ForeslåttForelder = {
                        ...motpartFunnet,
                        barnIdent: søkteBarn.ident,
                        barnNavn: søkteBarn.visningsnavn,
                    };

                    settForeslåttMotpart(
                        foreslåttMotpart && foreslåttMotpart.length > 0
                            ? [...foreslåttMotpart, nyForeslåttForelder]
                            : [nyForeslåttForelder],
                    );
                } else {
                    settForeslåttMotpart([]);
                }
            } catch (error) {
                settFeil("Noe gikk galt ved søk");
                await SecureLoggerService.error(
                    "Noe gikk galt ved søk",
                    error instanceof Error ? error : new Error(String(error)),
                );
            }
        };

        handleForeldreinformasjon();
    }, [foreldreinformasjonTilBarn, foreldreinformasjonTilBarnError]);

    const settMotpartUkjent = () => {
        settMotpartUkjentBase();
        settMotpartIdentForSøskenSøk(null);
        settMotpartErManueltValgt(false);
        settInfoMelding("Motpart satt som ukjent. Du kan nå legge til barn fra forskjellige medforeldre.");
    };

    const settMotpartManuelt = (person: PersonDto) => {
        leggTilMotpartManuell(person);
        settMotpartIdentForSøskenSøk(person.ident);
        settMotpartErManueltValgt(true);
        settInfoMelding("");
    };

    const leggTilBarnManuell = async (barn: PersonDto, alder: number) => {
        settFeil("");
        settSøkteBarn(barn);

        // Legg til barn med alder - bruk barn-parameteren direkte, ikke søkteBarn (state er asynkron)
        const nyttBarn: BarnMedAlder = {
            ident: barn.ident,
            navn: barn.visningsnavn,
            fødselsdato: formaterDato(barn.fødselsdato),
            alder: alder,
            erMyndig: alder >= MYNDYG_BARN_ALDER,
            diskresjonskode: barn.diskresjonskode,
        };

        form.setValue("valgteBarn", [...form.getValues("valgteBarn"), nyttBarn]);
    };

    const fjernBarn = (barnIdent: string) => {
        const oppdaterteBarn = form.getValues("valgteBarn").filter((b: BarnMedAlder) => b.ident !== barnIdent);
        form.setValue("valgteBarn", oppdaterteBarn);

        if (oppdaterteBarn.length === 0) {
            settForeslåttMotpart([]);
            settSøsken([]);
            settMotpartErManueltValgt(false);
            settInfoMelding("");
            form.setValue("motpart", {
                ident: "",
                navn: "",
                erKjent: false,
                rolle: motsattRolle,
                diskresjonskode: undefined,
            });
        } else {
            const oppdaterteSøsken = søsken.filter((s) => !oppdaterteBarn.some((b) => b.ident === s.ident));
            settSøsken(oppdaterteSøsken);
        }
    };

    const brukForeslåttMotpart = (forelder: ForeslåttForelder) => {
        form.setValue("motpart", {
            ident: forelder.ident,
            navn: forelder.visningsnavn,
            erKjent: true,
            rolle: motsattRolle,
            diskresjonskode: forelder.diskresjonskode,
        });
        settMotpartIdentForSøskenSøk(forelder.ident);
        settMotpartErManueltValgt(false);
        settInfoMelding("");
    };

    const foreslåttEnkeltMotpart = foreslåttMotpart.length === 1 ? foreslåttMotpart[0] : undefined;
    const visValideringsAlerts = valgteBarn.length > 0 || (erBidragsmottaker && valgteBarn.length === 0);

    return (
        <Box
            as="form"
            onSubmit={onSubmit}
            borderRadius={"2"}
            background="default"
            padding={"space-12"}
            className="gap-4 flex flex-col"
        >
            <VStack gap="space-6">
                <VStack gap="space-4">
                    <Heading level="2" size="medium" spacing>
                        Legg til barn
                    </Heading>
                    <BodyShort size="small" className="text-ax-neutral-700">
                        Ingen barn funnet i registeret. Vi finner ingen registrerte barn for denne personen. Du kan
                        legge til barn og den andre forelderen manuelt.
                    </BodyShort>

                    {feil && (
                        <Alert size="small" variant="error">
                            {feil}
                        </Alert>
                    )}

                    {eksisterendeSakInfoMelding && (
                        <Alert size="small" variant={eksisterendeSakInfoMelding.type}>
                            {eksisterendeSakInfoMelding.melding}
                        </Alert>
                    )}

                    <EksisterendeSakSection
                        harEksisterendeSak={harEksisterendeSak}
                        eksisterendeSak={eksisterendeSak}
                        partISakenNavn={partISaken.navn}
                        motpartNavn={motpart.navn}
                    />
                </VStack>

                {isLoadingHentSak && <LasterSkeleton tekst="Henter sak..." />}

                <BarnManueltRegistrering barnkurver={[]} form={form} leggTilBarnMauell={leggTilBarnManuell} />

                {foreldreinformasjonTilBarnError !== null &&
                    foreldreinformasjonTilBarnError instanceof TilgangsFeilError && (
                        <Alert variant="info" size="small">
                            {foreldreinformasjonTilBarnError.message}. Vennligst legg til motpart manuell
                        </Alert>
                    )}

                {infoMelding && (
                    <Alert variant="info" size="small">
                        {infoMelding}
                    </Alert>
                )}

                <div className="border-t border-ax-neutral-300" />

                <VStack gap="space-4">
                    <ValgteBarnListe
                        form={form}
                        valgteBarn={valgteBarn}
                        alleBarn={valgteBarn}
                        fjernBarn={fjernBarn}
                        tittel="Barn som legges til"
                        heading={{ size: "medium", level: "2" }}
                        visReellMottaker={true}
                        bidragsmottakerErUkjent={bidragsmottakerErUkjent}
                        reellMottakerAlltidPåkrevd={false}
                        kunSamhandlerSomReellMottaker={false}
                    />

                    {foreslåttEnkeltMotpart && (
                        <MotpartVelger
                            form={form}
                            tittel={`Foreslått ${motsattRolle}`}
                            beskrivelse={`Vi fant at ${foreslåttEnkeltMotpart.visningsnavn} (${foreslåttEnkeltMotpart.ident}) er registrert som forelder til ${foreslåttEnkeltMotpart.barnNavn} (${foreslåttEnkeltMotpart.barnIdent}).`}
                            variant="success"
                            velgAnnenMotpart={() => bidragsmottakerRegistreringRef.current?.showModal()}
                            settMotpartUkjent={settMotpartUkjent}
                            foreslåttMotpartNavn={foreslåttEnkeltMotpart.visningsnavn}
                            brukForeslåttMotpart={() => brukForeslåttMotpart(foreslåttEnkeltMotpart)}
                        />
                    )}

                    {foreslåttMotpart?.length > 1 && (
                        <FlereForeslåttMotpartVelger
                            form={form}
                            foreslåttMotparter={foreslåttMotpart}
                            tittel={`Foreslått ${motsattRolle}`}
                            settMotpartUkjent={settMotpartUkjent}
                            velgAnnenMotpart={() => bidragsmottakerRegistreringRef.current?.showModal()}
                            brukForeslåttMotpart={(forelder) => brukForeslåttMotpart(forelder)}
                        />
                    )}

                    {valgteBarn.length > 0 && foreslåttMotpart?.length === 0 && !motpart.erKjent && (
                        <MotpartVelger
                            form={form}
                            tittel="Ingen forelder registrert"
                            beskrivelse="Dette barnet har ingen registrerte foreldre. Motpart settes til ukjent, men du kan registrere motpart manuelt om nødvendig."
                            variant="warning"
                            velgAnnenMotpart={() => bidragsmottakerRegistreringRef.current?.showModal()}
                            settMotpartUkjent={settMotpartUkjent}
                        />
                    )}

                    <SøskenListe søsken={søsken} form={form} />

                    {erBidragspliktig && valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                        <Alert variant="error" size="small">
                            {form.formState.errors.valgteBarn.message}
                        </Alert>
                    )}
                </VStack>

                <div className="border-t border-ax-neutral-300" />

                <MotpartSection
                    form={form}
                    onSettMotpartUkjent={settMotpartUkjent}
                    onLeggTilMotpartManuell={settMotpartManuelt}
                    bidragsmottakerRegistreringRef={bidragsmottakerRegistreringRef}
                    visOppsummering={valgteBarn.length > 0}
                />

                {visValideringsAlerts && (
                    <>
                        <div className="border-t border-ax-neutral-300" />
                        <ValideringsAlertsSection
                            visUfullstendigRelasjonAlert={valgteBarn.length > 0}
                            visBMUtenBarnAlert={erBidragsmottaker && valgteBarn.length === 0}
                        />
                    </>
                )}

                <div className="border-t border-ax-neutral-300" />

                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    disabled={harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                    submitError={error}
                    saksnummer={saksnummer}
                />
            </VStack>
        </Box>
    );
}
