import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";
import BMUtenBarnAlert from "../../components/BMUtenBarnAlert";
import ParterSeksjon from "../../felles/ParterSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import {
    type BarnebidragSkjemaData,
    BarnebidragSkjemaSchema,
    type ForelderPart,
    MYNDYG_BARN_ALDER,
    type PartISaken,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import UfullstendigRelasjonAlert from "../../UfullstendigRelasjonAlert";
import { useBarnebidragFlyt } from "./useBarnebidragFlyt";

const IKKE_VALGT: ForelderPart = { ident: "", navn: "", erKjent: undefined };

function lagStartverdier(
    partISaken: PartISaken,
    alder: number | null,
    fødselsdato: string | undefined,
    kategori: BarnebidragSkjemaData["kategori"],
): BarnebidragSkjemaData {
    const søkt: ForelderPart = {
        ident: partISaken.ident,
        navn: partISaken.navn,
        erKjent: true,
        diskresjonskode: partISaken.diskresjonskode,
    };
    const erBarn = partISaken.rolle === "barn_over_18" || partISaken.rolle === "barn_under_18";

    return {
        låstRolle: partISaken.rolle,
        søktIdent: partISaken.ident,
        bidragspliktig: partISaken.rolle === "bidragspliktig" ? søkt : IKKE_VALGT,
        bidragsmottaker: partISaken.rolle === "bidragsmottaker" ? søkt : IKKE_VALGT,
        valgteBarn: erBarn
            ? [
                  {
                      ident: partISaken.ident,
                      navn: partISaken.navn,
                      fødselsdato,
                      alder: alder ?? 0,
                      erMyndig: partISaken.rolle === "barn_over_18" || (alder ?? 0) >= MYNDYG_BARN_ALDER,
                      reellMottakerType: "ingen",
                      reellMottaker: "",
                      reellMottakerNavn: "",
                      manuellLagtTil: true,
                      diskresjonskode: partISaken.diskresjonskode,
                  },
              ]
            : [],
        kategori,
    };
}

/**
 * Én flyt for barnebidrag, uansett om saken startes fra en forelder eller fra barnet.
 */
export default function BarnebidragFlyt() {
    const { partISaken, saksrolleFlyt } = useSaksrolleroversikt();

    if (!partISaken || saksrolleFlyt?.type !== "BARNEBIDRAG") {
        return null;
    }

    return <BarnebidragSkjema partISaken={partISaken} />;
}

function BarnebidragSkjema({ partISaken }: { partISaken: PartISaken }) {
    const { partISakenAlder, valgtPerson, sakskategori } = useSaksrolleroversikt();
    const form = useForm<BarnebidragSkjemaData>({
        resolver: zodResolver(BarnebidragSkjemaSchema),
        defaultValues: lagStartverdier(
            partISaken,
            partISakenAlder,
            valgtPerson?.fødselsdato ?? undefined,
            sakskategori,
        ),
        mode: "onChange",
    });

    return (
        <FormProvider {...form}>
            <BarnebidragFlytInnhold />
        </FormProvider>
    );
}

function BarnebidragFlytInnhold() {
    const {
        form,
        barnkurver,
        onKurvByttet,
        låsteIdenter,
        reellMottakerRegel,
        kort,
        onSubmit,
        innsending,
        meldinger,
        status,
    } = useBarnebidragFlyt();

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
                    {meldinger.ufullstendigRelasjon && <UfullstendigRelasjonAlert />}
                    {meldinger.bidragsmottakerUtenBarn && <BMUtenBarnAlert />}
                </>
            }
            innsending={innsending}
        >
            <BarnSection
                form={form}
                barnkurver={barnkurver}
                reellMottakerRegel={reellMottakerRegel}
                onKurvByttet={onKurvByttet}
                låsteIdenter={låsteIdenter}
            />
            <ParterSeksjon kort={kort} />
        </RolleFlytSide>
    );
}
