import { TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Tag } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { FormProvider, type UseFormReturn, useForm, useFormContext } from "react-hook-form";
import { useHentForeldreinformasjonForBarn, useSjekkTilgangOpprettSakUtenBm } from "~/api/useApi.ts";
import BarnManueltRegistrering from "../../BarnManueltRegistrering";
import BMUtenBarnAlert from "../../components/BMUtenBarnAlert";
import KanIkkeOppretteSakAlert from "../../components/KanIkkeOppretteSakAlert";
import RolleFlytSide from "../../felles/RolleFlytSide";
import SkjemaSeksjon from "../../felles/SkjemaSeksjon";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import MotpartVelger from "../../motpart-felles/MotpartVelger";
import ValgteBarnListe from "../../motpart-felles/ValgteBarnListe";
import type { BarnMedAlder, PartISaken } from "../../opprett-sak-schema";
import {
    type ForelderPartRolle,
    type ForelderUtenBarnSkjemaData,
    ForelderUtenBarnSkjemaSchema,
    MYNDYG_BARN_ALDER,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import MotpartSection from "../../sections/MotpartSection";
import UfullstendigRelasjonAlert from "../../UfullstendigRelasjonAlert";
import { hentMotsattRolle } from "../../utils";
import {
    type ForeslåttForelder,
    utledForelderUtenBarnParter,
    utledForelderUtenBarnStatus,
} from "./forelder-uten-barn-visningsmodell";
import SøskenListe from "./SøskenListe";
import { useForeldreForslag } from "./useForeldreForslag";
import { useMotpartValg } from "./useMotpartValg";
import { useSøsken } from "./useSøsken";

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
    return <ForelderUtenBarnSkjema partISaken={partISaken} />;
}

function ForelderUtenBarnSkjema({ partISaken }: { partISaken: PartISaken }) {
    const form = useFormContext<ForelderUtenBarnSkjemaData>();
    useSyncKategori(form);
    const [søkteBarn, settSøkteBarn] = useState<PersonDto | null>(null);
    const [feil, settFeil] = useState<string>("");
    const [infoMelding, settInfoMelding] = useState<string>("");
    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);
    const motpartValg = useMotpartValg(form, motsattRolle, settInfoMelding);

    useEffect(() => {
        form.setValue("partISaken.rolle", partISaken.rolle);
    }, [partISaken.rolle]);

    const valgteBarn = form.watch("valgteBarn");
    const motpart = form.watch("motpart");

    const {
        erBidragspliktig,
        erBidragsmottaker,
        bidragsmottaker,
        bidragspliktig,
        bidragsmottakerErUkjent,
        normalisertMotpart,
    } = utledForelderUtenBarnParter(partISaken, motpart);
    const { data: kanOppretteSakUtenBm, isLoading: sjekkerTilgangUtenBm } =
        useSjekkTilgangOpprettSakUtenBm(bidragsmottakerErUkjent);

    const { data: foreldreinformasjonTilBarn, error: foreldreinformasjonTilBarnError } =
        useHentForeldreinformasjonForBarn(søkteBarn ? { ident: søkteBarn.ident } : null, søkteBarn !== null);

    const { onSubmit, sakStatus, innsending, harEksisterendeSak, isLoadingHentSak, isLoadingEnhet } = useFlowSubmission(
        {
            form,
            partISaken: { ...partISaken, erKjent: true },
            motpart: normalisertMotpart,
            valgteBarn,
            bidragspliktig,
            bidragsmottaker,
            eksisterendeSakPartISaken: { ...partISaken, erKjent: true },
            eksisterendeSakMotpart: normalisertMotpart,
        },
    );

    const { søsken, settSøsken } = useSøsken({
        motpartBarnRelasjon: motpartValg.motpartBarnRelasjon,
        valgteBarn,
        onMotpartSøkFerdig: () => motpartValg.settMotpartIdentForSøskenSøk(null),
    });

    useForeldreForslag({
        barn: søkteBarn,
        foreldreinformasjon: foreldreinformasjonTilBarn,
        form,
        motpart,
        motpartErManueltValgt: motpartValg.motpartErManueltValgt,
        motsattRolle,
        onFeil: settFeil,
        onInfoMelding: settInfoMelding,
        onMotpartSøk: motpartValg.settMotpartIdentForSøskenSøk,
        onMotpartValgt: motpartValg.settMotpartErManueltValgt,
        onForeslåtteForeldre: motpartValg.settForeslåttMotpart,
        partISaken,
    });

    const leggTilBarnManuell = async (barn: PersonDto, alder: number) => {
        settFeil("");
        settInfoMelding("");
        settSøkteBarn(barn);
        const nyttBarn: BarnMedAlder = {
            ident: barn.ident,
            navn: barn.visningsnavn,
            fødselsdato: formaterDato(barn.fødselsdato),
            alder,
            erMyndig: alder >= MYNDYG_BARN_ALDER,
            diskresjonskode: barn.diskresjonskode,
        };
        form.setValue("valgteBarn", [...form.getValues("valgteBarn"), nyttBarn]);
    };

    const fjernBarn = (barnIdent: string) => {
        settFeil("");
        settInfoMelding("");
        const oppdaterteBarn = form.getValues("valgteBarn").filter((b: BarnMedAlder) => b.ident !== barnIdent);
        form.setValue("valgteBarn", oppdaterteBarn);

        if (oppdaterteBarn.length === 0) {
            settSøsken([]);
            motpartValg.nullstillMotpart();
        } else {
            settSøsken(søsken.filter((s) => !oppdaterteBarn.some((b) => b.ident === s.ident)));
        }
    };

    const status = utledForelderUtenBarnStatus({
        antallValgteBarn: valgteBarn.length,
        erBidragsmottaker,
        bidragsmottakerErUkjent,
        sjekkerTilgangUtenBm,
        kanOppretteSakUtenBm,
        harEksisterendeSak,
        lasterEksisterendeSak: isLoadingHentSak,
        lasterEnhet: isLoadingEnhet,
    });

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{
                ...sakStatus,
                partISakenNavn: partISaken.navn,
                motpartNavn: motpart.navn,
            }}
            meldinger={
                <ForelderUtenBarnMeldinger
                    tilgangsfeil={foreldreinformasjonTilBarnError}
                    infoMelding={infoMelding}
                    visUfullstendigRelasjon={status.visUfullstendigRelasjon}
                    visBidragsmottakerUtenBarn={status.visBidragsmottakerUtenBarn}
                    kanIkkeOppretteSakUtenBm={status.kanIkkeOppretteSakUtenBm}
                />
            }
            submit={<EnhetOgSubmitSection {...innsending} blocked={status.submitBlokkert} />}
        >
            <ForelderUtenBarnBarnSeksjon
                form={form}
                valgteBarn={valgteBarn}
                feil={feil}
                leggTilBarnManuell={leggTilBarnManuell}
                fjernBarn={fjernBarn}
                søsken={søsken}
                bidragsmottakerErUkjent={bidragsmottakerErUkjent}
                erBidragspliktig={erBidragspliktig}
            />

            <ForelderUtenBarnMotpartSeksjon
                form={form}
                valgteBarn={valgteBarn}
                foreslåttMotpart={motpartValg.foreslåttMotpart}
                motsattRolle={motsattRolle}
                settMotpartUkjent={motpartValg.settMotpartUkjent}
                settMotpartManuelt={motpartValg.settMotpartManuelt}
                brukForeslåttMotpart={motpartValg.brukForeslåttMotpart}
            />
        </RolleFlytSide>
    );
}

function ForelderUtenBarnMeldinger({
    tilgangsfeil,
    infoMelding,
    visUfullstendigRelasjon,
    visBidragsmottakerUtenBarn,
    kanIkkeOppretteSakUtenBm,
}: {
    tilgangsfeil: unknown;
    infoMelding: string;
    visUfullstendigRelasjon: boolean;
    visBidragsmottakerUtenBarn: boolean;
    kanIkkeOppretteSakUtenBm: boolean;
}) {
    return (
        <>
            {tilgangsfeil instanceof TilgangsFeilError && (
                <Alert variant="info" size="small">
                    {tilgangsfeil.message}. Legg til motpart manuelt.
                </Alert>
            )}
            {infoMelding && (
                <Alert variant="info" size="small">
                    {infoMelding}
                </Alert>
            )}
            {visUfullstendigRelasjon && <UfullstendigRelasjonAlert />}
            {visBidragsmottakerUtenBarn && <BMUtenBarnAlert />}
            {kanIkkeOppretteSakUtenBm && <KanIkkeOppretteSakAlert />}
        </>
    );
}

function ForelderUtenBarnBarnSeksjon({
    form,
    valgteBarn,
    feil,
    leggTilBarnManuell,
    fjernBarn,
    søsken,
    bidragsmottakerErUkjent,
    erBidragspliktig,
}: {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    valgteBarn: BarnMedAlder[];
    feil: string;
    leggTilBarnManuell: (barn: PersonDto, alder: number) => Promise<void>;
    fjernBarn: (barnIdent: string) => void;
    søsken: BarnMedAlder[];
    bidragsmottakerErUkjent: boolean;
    erBidragspliktig: boolean;
}) {
    return (
        <SkjemaSeksjon
            tittel="Velg barn saken gjelder for"
            beskrivelse="Ingen barn funnet i registeret. Legg til barn manuelt."
            handling={
                <Tag size="small" variant="info">
                    {valgteBarn.length} valgt
                </Tag>
            }
        >
            {feil && (
                <Alert size="small" variant="error">
                    {feil}
                </Alert>
            )}
            <BarnManueltRegistrering barnkurver={[]} form={form} leggTilBarnManuell={leggTilBarnManuell} />
            <ValgteBarnListe
                form={form}
                valgteBarn={valgteBarn}
                alleBarn={valgteBarn}
                fjernBarn={fjernBarn}
                tittel="Barn som legges til"
                heading={{ size: "small", level: "3" }}
                reellMottakerRegel={{ type: "etter-barn", bidragsmottakerErUkjent }}
            />
            <SøskenListe søsken={søsken} form={form} />
            {erBidragspliktig && valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                <Alert variant="error" size="small">
                    {form.formState.errors.valgteBarn.message}
                </Alert>
            )}
        </SkjemaSeksjon>
    );
}

function ForelderUtenBarnMotpartSeksjon({
    form,
    valgteBarn,
    foreslåttMotpart,
    motsattRolle,
    settMotpartUkjent,
    settMotpartManuelt,
    brukForeslåttMotpart,
}: {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    valgteBarn: BarnMedAlder[];
    foreslåttMotpart: ForeslåttForelder[];
    motsattRolle: ForelderPartRolle;
    settMotpartUkjent: () => void;
    settMotpartManuelt: (person: PersonDto) => void;
    brukForeslåttMotpart: (forelder: ForeslåttForelder) => void;
}) {
    const enesteForeslåtteMotpart = foreslåttMotpart.length === 1 ? foreslåttMotpart[0] : undefined;

    return (
        <MotpartSection
            form={form}
            onLeggTilMotpartManuell={settMotpartManuelt}
            visPersonsøk={foreslåttMotpart.length === 0}
            motpartvalg={
                valgteBarn.length > 0 ? (
                    <MotpartVelger
                        form={form}
                        tittel={foreslåttMotpart.length > 0 ? `Foreslått ${motsattRolle}` : "Ingen forelder registrert"}
                        beskrivelse={
                            enesteForeslåtteMotpart
                                ? `Vi fant at ${enesteForeslåtteMotpart.visningsnavn} (${enesteForeslåtteMotpart.ident}) er registrert som forelder til ${enesteForeslåtteMotpart.barnNavn} (${enesteForeslåtteMotpart.barnIdent}).`
                                : foreslåttMotpart.length > 1
                                  ? "Vi fant flere foreldre som er registrert som forelder til valgte barn."
                                  : "Valgte barn har ingen registrerte foreldre. Motpart er foreløpig ukjent, men du kan registrere en person."
                        }
                        settMotpartUkjent={settMotpartUkjent}
                        foreslåtteMotparter={foreslåttMotpart.map((forelder) => ({
                            ident: forelder.ident,
                            navn: forelder.visningsnavn,
                            fødselsdato: forelder.fødselsdato ?? undefined,
                        }))}
                        brukForeslåttMotpart={(ident) => {
                            const forelder = foreslåttMotpart.find((forslag) => forslag.ident === ident);
                            if (forelder) {
                                brukForeslåttMotpart(forelder);
                            }
                        }}
                    />
                ) : undefined
            }
        />
    );
}
