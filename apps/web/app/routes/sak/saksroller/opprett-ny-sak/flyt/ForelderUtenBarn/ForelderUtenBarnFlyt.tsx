import { TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Tag } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { FormProvider, type UseFormReturn, useForm, useFormContext } from "react-hook-form";
import {
    useHentForeldreinformasjonForBarn,
    useHentPersonMotpartBarnRelasjon,
    useSjekkTilgangOpprettSakUtenBm,
} from "~/api/useApi.ts";
import BarnManueltRegistrering from "../../BarnManueltRegistrering";
import BMUtenBarnAlert from "../../components/BMUtenBarnAlert";
import KanIkkeOppretteSakAlert from "../../components/KanIkkeOppretteSakAlert";
import RolleFlytSide from "../../felles/RolleFlytSide";
import SkjemaSeksjon from "../../felles/SkjemaSeksjon";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import { useMotpartHandling } from "../../hooks/useMotpartHandling";
import useSyncKategori from "../../hooks/useSyncKategori";
import MotpartVelger from "../../motpart-felles/MotpartVelger";
import ValgteBarnListe from "../../motpart-felles/ValgteBarnListe";
import type { BarnMedAlder } from "../../opprett-sak-schema";
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
import SøskenListe from "./SøskenListe";
import { useForeldreForslag } from "./useForeldreForslag";
import { useSøsken } from "./useSøsken";

type ForeslåttForelder = {
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
    const [motpartErManueltValgt, settMotpartErManueltValgt] = useState(false);
    const [motpartIdentForSøskenSøk, settMotpartIdentForSøskenSøk] = useState<string | null>(null);
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
    const { data: kanOppretteSakUtenBm, isLoading: sjekkerTilgangUtenBm } =
        useSjekkTilgangOpprettSakUtenBm(bidragsmottakerErUkjent);

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
        isLoadingOpprettSak,
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

    const { søsken, settSøsken } = useSøsken({
        motpartBarnRelasjon,
        valgteBarn,
        onMotpartSøkFerdig: () => settMotpartIdentForSøskenSøk(null),
    });

    useForeldreForslag({
        barn: søkteBarn,
        foreldreinformasjon: foreldreinformasjonTilBarn,
        foreslåttMotpart,
        form,
        motpart,
        motpartErManueltValgt,
        motsattRolle,
        onFeil: settFeil,
        onInfoMelding: settInfoMelding,
        onMotpartSøk: settMotpartIdentForSøskenSøk,
        onMotpartValgt: settMotpartErManueltValgt,
        onForeslåtteForeldre: settForeslåttMotpart,
        partISaken,
    });

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
        settInfoMelding("");
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
        settFeil("");
        settInfoMelding("");
        const oppdaterteBarn = form.getValues("valgteBarn").filter((b: BarnMedAlder) => b.ident !== barnIdent);
        form.setValue("valgteBarn", oppdaterteBarn);

        if (oppdaterteBarn.length === 0) {
            settForeslåttMotpart([]);
            settSøsken([]);
            settMotpartErManueltValgt(false);
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

    const kanIkkeOpprettSakUtenBm = bidragsmottakerErUkjent && !sjekkerTilgangUtenBm && kanOppretteSakUtenBm === false;
    const visValideringsAlerts =
        valgteBarn.length > 0 || (erBidragsmottaker && valgteBarn.length === 0) || kanIkkeOpprettSakUtenBm;

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{
                infoMelding: eksisterendeSakInfoMelding,
                harEksisterendeSak,
                eksisterendeSak,
                isLoading: isLoadingHentSak,
                partISakenNavn: partISaken.navn,
                motpartNavn: motpart.navn,
            }}
            meldinger={
                <ForelderUtenBarnMeldinger
                    tilgangsfeil={foreldreinformasjonTilBarnError}
                    infoMelding={infoMelding}
                    visValideringsAlerts={visValideringsAlerts}
                    harValgteBarn={valgteBarn.length > 0}
                    erBidragsmottaker={erBidragsmottaker}
                    kanIkkeOppretteSakUtenBm={kanIkkeOpprettSakUtenBm}
                />
            }
            submit={
                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    blocked={
                        harEksisterendeSak ||
                        isLoadingHentSak ||
                        isLoadingEnhet ||
                        (bidragsmottakerErUkjent && (sjekkerTilgangUtenBm || kanOppretteSakUtenBm !== true))
                    }
                    submitError={error}
                    isLoading={isLoadingOpprettSak}
                    saksnummer={saksnummer}
                />
            }
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
                foreslåttMotpart={foreslåttMotpart}
                motsattRolle={motsattRolle}
                settMotpartUkjent={settMotpartUkjent}
                settMotpartManuelt={settMotpartManuelt}
                brukForeslåttMotpart={brukForeslåttMotpart}
            />
        </RolleFlytSide>
    );
}

function ForelderUtenBarnMeldinger({
    tilgangsfeil,
    infoMelding,
    visValideringsAlerts,
    harValgteBarn,
    erBidragsmottaker,
    kanIkkeOppretteSakUtenBm,
}: {
    tilgangsfeil: unknown;
    infoMelding: string;
    visValideringsAlerts: boolean;
    harValgteBarn: boolean;
    erBidragsmottaker: boolean;
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
            {visValideringsAlerts && (
                <>
                    {harValgteBarn && <UfullstendigRelasjonAlert />}
                    {erBidragsmottaker && !harValgteBarn && <BMUtenBarnAlert />}
                    {kanIkkeOppretteSakUtenBm && <KanIkkeOppretteSakAlert />}
                </>
            )}
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
