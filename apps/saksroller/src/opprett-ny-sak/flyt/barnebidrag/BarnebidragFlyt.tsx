import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjonSuspense } from "../../../api/person.api";
import { MYNDYG_BARN_ALDER } from "../../../felles/saksregler";
import BarnSection from "../../barn/BarnSection";
import BMUtenBarnAlert from "../../barn/BMUtenBarnAlert";
import ParterSeksjon from "../../parter/ParterSeksjon";
import UfullstendigRelasjonValgteBarnAlert from "../../parter/UfullstendigRelasjonValgteBarnAlert";
import { useOpprettSakStart } from "../../skjema/OpprettSakStartContext";
import {
    type BarnebidragForelderRolle,
    type BarnebidragSkjemaData,
    BarnebidragSkjemaSchema,
    type ForelderPart,
    type PartISaken,
} from "../../skjema/opprett-sak-schema";
import RolleFlytSide from "../../skjema/RolleFlytSide";
import { harMotpartMedUlikeForelderroller } from "./barnebidrag-relasjonsvalidering";
import { useBarnebidragFlyt } from "./useBarnebidragFlyt";

const IKKE_VALGT: ForelderPart = { ident: "", navn: "", erKjent: undefined };

function lagStartverdier(
    partISaken: PartISaken,
    alder: number | null,
    fødselsdato: string | undefined,
): BarnebidragSkjemaData {
    const søkt: ForelderPart = {
        ident: partISaken.ident,
        navn: partISaken.navn,
        erKjent: true,
        diskresjonskode: partISaken.diskresjonskode,
    };
    const erBarn = erBarnRolle(partISaken);

    return {
        roller: [
            { ...(partISaken.rolle === "bidragspliktig" ? søkt : IKKE_VALGT), type: "BP" },
            { ...(partISaken.rolle === "bidragsmottaker" ? søkt : IKKE_VALGT), type: "BM" },
        ] satisfies BarnebidragForelderRolle[],
        valgteBarn: erBarn
            ? [
                  {
                      ident: partISaken.ident,
                      navn: partISaken.navn,
                      fødselsdato,
                      alder: alder ?? 0,
                      erMyndig: partISaken.rolle === "barn_over_18" || (alder ?? 0) >= MYNDYG_BARN_ALDER,
                      manuellLagtTil: true,
                      diskresjonskode: partISaken.diskresjonskode,
                  },
              ]
            : [],
        kategori: "Nasjonal",
    };
}

/**
 * Én flyt for barnebidrag, uansett om saken startes fra en forelder eller fra barnet.
 */
export default function BarnebidragFlyt() {
    const { partISaken } = useOpprettSakStart();

    if (!partISaken) return null;
    if (erBarnRolle(partISaken)) return <BarnebidragSkjema partISaken={partISaken} />;
    return <BarnebidragForForelder partISaken={partISaken} />;
}

function erBarnRolle({ rolle }: PartISaken) {
    return rolle === "barn_over_18" || rolle === "barn_under_18";
}

function BarnebidragForForelder({ partISaken }: { partISaken: PartISaken }) {
    const { data } = useHentPersonMotpartBarnRelasjonSuspense({ ident: partISaken.ident });
    const relasjoner = data?.personensMotpartBarnRelasjon ?? [];

    if (harMotpartMedUlikeForelderroller(relasjoner)) {
        return (
            <Alert variant="error" size="small">
                Samme motpart er registrert med flere forelderroller (f.eks. både mor og far) for{" "}
                <span className="personnavn">{partISaken.navn}</span>. Kontakt support for å få hjelp.
            </Alert>
        );
    }

    return <BarnebidragSkjema partISaken={partISaken} />;
}

function BarnebidragSkjema({ partISaken }: { partISaken: PartISaken }) {
    const { partISakenAlder, startperson } = useOpprettSakStart();
    const form = useForm<BarnebidragSkjemaData>({
        resolver: zodResolver(BarnebidragSkjemaSchema),
        defaultValues: lagStartverdier(partISaken, partISakenAlder, startperson.fødselsdato ?? undefined),
        mode: "onSubmit",
    });

    return (
        <FormProvider {...form}>
            <BarnebidragFlytInnhold />
        </FormProvider>
    );
}

function BarnebidragFlytInnhold() {
    const { form, barnkurver, onKurvByttet, reellMottakerRegel, kort, onSubmit, innsending, meldinger, status } =
        useBarnebidragFlyt();

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={status}
            meldinger={
                <>
                    {meldinger.tilgangsfeil && (
                        <Alert variant="info" size="small">
                            {meldinger.tilgangsfeil}. Legg til forelder manuelt.
                        </Alert>
                    )}
                    {meldinger.forslagsfeil && (
                        <Alert variant="warning" size="small">
                            {meldinger.forslagsfeil}
                        </Alert>
                    )}
                    {meldinger.ufullstendigRelasjon && <UfullstendigRelasjonValgteBarnAlert />}
                    {meldinger.bidragsmottakerUtenBarn && <BMUtenBarnAlert />}
                </>
            }
            innsending={innsending}
        >
            <ParterSeksjon
                kort={kort}
                beskrivelse={
                    kort.some((k) => k.part.erKjent === undefined)
                        ? "Velg barn nedenfor for å få forslag til foreldre."
                        : undefined
                }
            />
            <BarnSection
                form={form}
                barnkurver={barnkurver}
                reellMottakerRegel={reellMottakerRegel}
                onKurvByttet={onKurvByttet}
            />
        </RolleFlytSide>
    );
}
